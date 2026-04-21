import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AuditLog, User, Warrant, mockAuditLogs, mockUsers, mockWarrants } from '../data/mockData';
import {
  authenticateWithSupabase,
  deleteWarrantById,
  loadFromSupabase,
  upsertAuditLogs,
  upsertUsers,
  upsertWarrants,
} from '../services/supabasePersistence';
import { isSupabaseConfigured } from '../../lib/supabase';

type UserRole = 'Admin' | 'Warrant Officer' | 'Station Commander';

interface LoginResult {
  ok: boolean;
  message?: string;
}

interface AssignPayload {
  warrantId: string;
  officerName: string;
  dateAssigned: string;
  notes: string;
}

interface ServedPayload {
  dateServed: string;
  placeServed: string;
  remarks: string;
}

interface UnservedPayload {
  reasonUnserved: string;
  nextAction: string;
}

interface UpdateStatusPayload {
  warrantId: string;
  status: Warrant['status'];
  served?: ServedPayload;
  unserved?: UnservedPayload;
}

interface AddUserPayload {
  fullName: string;
  username: string;
  password: string;
  role: UserRole;
  status: User['status'];
}

interface SystemContextValue {
  isLoading: boolean;
  currentUser: User | null;
  warrants: Warrant[];
  users: User[];
  auditLogs: AuditLog[];
  urgentCount: number;
  overdueCount: number;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  addWarrant: (warrant: Omit<Warrant, 'id' | 'status'>) => void;
  updateWarrant: (warrantId: string, payload: Partial<Warrant>) => void;
  deleteWarrant: (warrantId: string) => void;
  assignWarrant: (payload: AssignPayload) => void;
  updateWarrantStatus: (payload: UpdateStatusPayload) => void;
  addUser: (payload: AddUserPayload) => void;
  editUser: (userId: string, payload: Partial<User> & { password?: string }) => void;
  deactivateUser: (userId: string) => void;
}

const STORAGE_KEYS = {
  users: 'warrant_system_users',
  warrants: 'warrant_system_warrants',
  auditLogs: 'warrant_system_audit_logs',
  sessionUserId: 'warrant_system_session_user_id',
};

const seededUsers: User[] = mockUsers.map((user) => ({
  ...user,
  password:
    user.username === 'admin'
      ? 'admin'
      : user.username === 'rsantos'
        ? 'commander123'
        : 'officer123',
}));

const SystemContext = createContext<SystemContextValue | undefined>(undefined);

function safeParse<T>(raw: string | null, fallback: T): T {
  try {
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(seededUsers);
  const [warrants, setWarrants] = useState<Warrant[]>(mockWarrants);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(mockAuditLogs);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const storedUsers = safeParse<User[]>(localStorage.getItem(STORAGE_KEYS.users), seededUsers);
      const storedWarrants = safeParse<Warrant[]>(localStorage.getItem(STORAGE_KEYS.warrants), mockWarrants);
      const storedAudit = safeParse<AuditLog[]>(localStorage.getItem(STORAGE_KEYS.auditLogs), mockAuditLogs);
      const storedUserId = localStorage.getItem(STORAGE_KEYS.sessionUserId);

      if (isSupabaseConfigured) {
        const remote = await loadFromSupabase();
        if (remote && active) {
          setUsers(remote.users.length ? remote.users : storedUsers);
          setWarrants(remote.warrants.length ? remote.warrants : storedWarrants);
          setAuditLogs(remote.auditLogs.length ? remote.auditLogs : storedAudit);

          if (storedUserId) {
            const found = (remote.users.length ? remote.users : storedUsers).find((u) => u.id === storedUserId) ?? null;
            setCurrentUser(found);
          }
          setIsLoading(false);
          return;
        }
      }

      if (active) {
        setUsers(storedUsers);
        setWarrants(storedWarrants);
        setAuditLogs(storedAudit);

        if (storedUserId) {
          const found = storedUsers.find((u) => u.id === storedUserId) ?? null;
          setCurrentUser(found);
        }

        setIsLoading(false);
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoading && !isSupabaseConfigured) {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    }
  }, [users, isLoading]);

  useEffect(() => {
    if (!isLoading && !isSupabaseConfigured) {
      localStorage.setItem(STORAGE_KEYS.warrants, JSON.stringify(warrants));
    }
  }, [warrants, isLoading]);

  useEffect(() => {
    if (!isLoading && !isSupabaseConfigured) {
      localStorage.setItem(STORAGE_KEYS.auditLogs, JSON.stringify(auditLogs));
    }
  }, [auditLogs, isLoading]);

  useEffect(() => {
    if (!isLoading && isSupabaseConfigured) {
      void upsertUsers(users);
    }
  }, [users, isLoading]);

  useEffect(() => {
    if (!isLoading && isSupabaseConfigured) {
      void upsertWarrants(warrants);
    }
  }, [warrants, isLoading]);

  useEffect(() => {
    if (!isLoading && isSupabaseConfigured) {
      void upsertAuditLogs(auditLogs);
    }
  }, [auditLogs, isLoading]);

  const logAction = (action: string, module: string) => {
    const actor = currentUser?.fullName ?? 'System';
    const entry: AuditLog = {
      id: generateId(),
      user: actor,
      action,
      module,
      dateTime: now(),
      ipAddress: '127.0.0.1',
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const login = async (username: string, password: string): Promise<LoginResult> => {
    const normalized = username.trim().toLowerCase();

    const found = isSupabaseConfigured
      ? await authenticateWithSupabase(normalized, password)
      : users.find(
          (u) => u.username.toLowerCase() === normalized && u.password === password,
        ) || null;

    if (!found) {
      return { ok: false, message: 'Invalid username or password' };
    }

    if (found.status !== 'Active') {
      return { ok: false, message: 'Your account is inactive. Please contact an administrator.' };
    }

    setCurrentUser(found);
    localStorage.setItem(STORAGE_KEYS.sessionUserId, found.id);
    return { ok: true };
  };

  const logout = () => {
    if (currentUser) {
      logAction('Logged out of the system', 'Authentication');
    }
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.sessionUserId);
  };

  const addWarrant = (warrant: Omit<Warrant, 'id' | 'status'>) => {
    const newWarrant: Warrant = {
      ...warrant,
      id: generateId(),
      status: 'Pending',
      dateAssigned: warrant.dateAssigned || new Date().toISOString().slice(0, 10),
    };
    setWarrants((prev) => [newWarrant, ...prev]);
    logAction(`Added new warrant for ${warrant.name}`, 'Warrant Encoding');
  };

  const updateWarrant = (warrantId: string, payload: Partial<Warrant>) => {
    setWarrants((prev) =>
      prev.map((w) => (w.id === warrantId ? { ...w, ...payload } : w)),
    );
    logAction('Updated warrant details', 'Warrant Records');
  };

  const deleteWarrant = (warrantId: string) => {
    const target = warrants.find((w) => w.id === warrantId);
    setWarrants((prev) => prev.filter((w) => w.id !== warrantId));
    if (target) {
      logAction(`Deleted warrant record for ${target.name}`, 'Warrant Records');
    }
    if (isSupabaseConfigured) {
      void deleteWarrantById(warrantId);
    }
  };

  const assignWarrant = ({ warrantId, officerName, dateAssigned, notes }: AssignPayload) => {
    const target = warrants.find((w) => w.id === warrantId);
    setWarrants((prev) =>
      prev.map((w) =>
        w.id === warrantId
          ? {
              ...w,
              assignedOfficer: officerName,
              dateAssigned,
              assignmentNotes: notes,
              status: 'Pending',
            }
          : w,
      ),
    );

    if (target) {
      logAction(
        `Assigned warrant (${target.caseNumber}) to ${officerName}`,
        'Warrant Assignment',
      );
    }
  };

  const updateWarrantStatus = ({ warrantId, status, served, unserved }: UpdateStatusPayload) => {
    const target = warrants.find((w) => w.id === warrantId);

    setWarrants((prev) =>
      prev.map((w) => {
        if (w.id !== warrantId) return w;

        if (status === 'Served') {
          return {
            ...w,
            status,
            dateServed: served?.dateServed || '',
            placeServed: served?.placeServed || '',
            servedRemarks: served?.remarks || '',
            reasonUnserved: '',
            nextAction: '',
          };
        }

        if (status === 'Unserved') {
          return {
            ...w,
            status,
            reasonUnserved: unserved?.reasonUnserved || '',
            nextAction: unserved?.nextAction || '',
            dateServed: '',
            placeServed: '',
            servedRemarks: '',
          };
        }

        return {
          ...w,
          status,
          dateServed: '',
          placeServed: '',
          servedRemarks: '',
          reasonUnserved: '',
          nextAction: '',
        };
      }),
    );

    if (target) {
      logAction(`Updated warrant status to ${status} for ${target.caseNumber}`, 'Warrant Status');
    }
  };

  const addUser = (payload: AddUserPayload) => {
    const newUser: User = {
      id: generateId(),
      fullName: payload.fullName,
      username: payload.username,
      password: payload.password,
      role: payload.role,
      status: payload.status,
    };

    setUsers((prev) => [newUser, ...prev]);
    logAction(`Added user account for ${payload.fullName}`, 'User Management');
  };

  const editUser = (userId: string, payload: Partial<User> & { password?: string }) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          ...payload,
          password: payload.password ? payload.password : u.password,
        };
      }),
    );
    logAction('Updated user account details', 'User Management');
  };

  const deactivateUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'Inactive' } : u)),
    );
    if (target) {
      logAction(`Deactivated user ${target.fullName}`, 'User Management');
    }
  };

  const urgentCount = useMemo(
    () => warrants.filter((w) => w.status === 'Pending' || w.status === 'Unserved').length,
    [warrants],
  );

  const overdueCount = useMemo(() => {
    const today = new Date();
    return warrants.filter((w) => {
      if (w.status !== 'Pending') return false;
      const issuedDate = new Date(w.dateIssued);
      const days = Math.floor((today.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 30;
    }).length;
  }, [warrants]);

  const value: SystemContextValue = {
    isLoading,
    currentUser,
    warrants,
    users,
    auditLogs,
    urgentCount,
    overdueCount,
    login,
    logout,
    addWarrant,
    updateWarrant,
    deleteWarrant,
    assignWarrant,
    updateWarrantStatus,
    addUser,
    editUser,
    deactivateUser,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem() {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used inside SystemProvider');
  }
  return context;
}
