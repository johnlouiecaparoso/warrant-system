import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppSettings, AuditLog, User, Warrant } from '../data/models';
import {
  authenticateWithSupabase,
  deleteWarrantById,
  getAuthenticatedProfile,
  loadFromSupabase,
  registerWithSupabaseAuth,
  saveSettingsToSupabase,
  saveUserToSupabase,
  saveWarrantToSupabase,
  sendPasswordResetEmail,
  signOutFromSupabase,
  subscribeToAuthChanges,
  updateAuthenticatedPassword,
  upsertAuditLogs,
} from '../services/supabasePersistence';
import { isSupabaseConfigured } from '../../lib/supabase';

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
  email: string;
  password: string;
}

interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
}

interface UpdateProfilePayload {
  fullName: string;
  password?: string;
}

type NewWarrantPayload = Omit<
  Warrant,
  'id' | 'status' | 'approvalStatus' | 'submittedBy' | 'submittedAt' | 'approvedBy' | 'approvedAt'
>;

interface SystemContextValue {
  isLoading: boolean;
  isBackendReady: boolean;
  backendMessage: string | null;
  currentUser: User | null;
  warrants: Warrant[];
  users: User[];
  auditLogs: AuditLog[];
  settings: AppSettings;
  urgentCount: number;
  overdueCount: number;
  login: (email: string, password: string) => Promise<LoginResult>;
  registerAccount: (payload: RegisterPayload) => Promise<LoginResult>;
  resetPassword: (email: string) => Promise<LoginResult>;
  completePasswordReset: (password: string) => Promise<LoginResult>;
  updateCurrentProfile: (payload: UpdateProfilePayload) => Promise<LoginResult>;
  saveSettings: (payload: Omit<AppSettings, 'id'>) => Promise<LoginResult>;
  logout: () => Promise<void>;
  addWarrant: (warrant: NewWarrantPayload) => Promise<LoginResult>;
  updateWarrant: (warrantId: string, payload: Partial<Warrant>) => Promise<LoginResult>;
  deleteWarrant: (warrantId: string) => Promise<LoginResult>;
  assignWarrant: (payload: AssignPayload) => Promise<LoginResult>;
  approveWarrant: (warrantId: string) => Promise<LoginResult>;
  updateWarrantStatus: (payload: UpdateStatusPayload) => Promise<LoginResult>;
  addUser: (payload: AddUserPayload) => Promise<LoginResult>;
  editUser: (userId: string, payload: Partial<User>) => Promise<LoginResult>;
  deactivateUser: (userId: string) => Promise<LoginResult>;
}

const DEFAULT_SETTINGS: AppSettings = {
  id: 'global',
  officeName: 'Butuan City Police Station 1',
  notifyOverdue: true,
  notifyPending: true,
};

const SystemContext = createContext<SystemContextValue | undefined>(undefined);
const LEGACY_STORAGE_KEYS = [
  'warrant_system_session_user_id',
  'warrant_system_users',
  'warrant_system_warrants',
  'warrant_system_audit_logs',
] as const;
const SUPABASE_REQUIRED_MESSAGE =
  'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use the system.';

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function now() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}

function normalizeUser(user: Partial<User> & { username?: string; email?: string }): User {
  return {
    id: user.id || generateId(),
    fullName: user.fullName || '',
    email: (user.email || user.username || '').toLowerCase(),
    role: user.role === 'Admin' ? 'Admin' : 'Warrant Officer',
    status: user.status === 'Inactive' ? 'Inactive' : 'Active',
  };
}

function normalizeWarrant(warrant: Partial<Warrant>): Warrant {
  return {
    id: warrant.id || generateId(),
    name: warrant.name || '',
    alias: warrant.alias || '',
    caseNumber: warrant.caseNumber || '',
    offense: warrant.offense || '',
    court: warrant.court || '',
    judge: warrant.judge || '',
    dateIssued: warrant.dateIssued || '',
    barangay: warrant.barangay || '',
    address: warrant.address || '',
    assignedOfficer: warrant.assignedOfficer || '',
    dateAssigned: warrant.dateAssigned,
    assignmentNotes: warrant.assignmentNotes,
    status: warrant.status || 'Pending',
    approvalStatus: warrant.approvalStatus === 'Approved' ? 'Approved' : 'For Approval',
    submittedBy: warrant.submittedBy,
    submittedAt: warrant.submittedAt,
    approvedBy: warrant.approvedBy,
    approvedAt: warrant.approvedAt,
    remarks: warrant.remarks || '',
    dateServed: warrant.dateServed,
    placeServed: warrant.placeServed,
    servedRemarks: warrant.servedRemarks,
    reasonUnserved: warrant.reasonUnserved,
    nextAction: warrant.nextAction,
  };
}

function normalizeSettings(settings?: Partial<AppSettings> | null): AppSettings {
  return {
    id: 'global',
    officeName: settings?.officeName?.trim() || DEFAULT_SETTINGS.officeName,
    notifyOverdue:
      typeof settings?.notifyOverdue === 'boolean'
        ? settings.notifyOverdue
        : DEFAULT_SETTINGS.notifyOverdue,
    notifyPending:
      typeof settings?.notifyPending === 'boolean'
        ? settings.notifyPending
        : DEFAULT_SETTINGS.notifyPending,
  };
}

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [warrants, setWarrants] = useState<Warrant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const applyRemoteState = async (profileOverride?: User | null) => {
    const remote = await loadFromSupabase();
    if (!remote) {
      setUsers([]);
      setWarrants([]);
      setAuditLogs([]);
      setSettings(DEFAULT_SETTINGS);
      setCurrentUser(profileOverride ?? null);
      return;
    }

    const normalizedUsers = remote.users.map((user) => normalizeUser(user));
    const resolvedCurrentUser =
      profileOverride ??
      (currentUser
        ? normalizedUsers.find((user) => user.id === currentUser.id) ?? null
        : null);

    setUsers(normalizedUsers);
    setWarrants(remote.warrants.map((warrant) => normalizeWarrant(warrant)));
    setAuditLogs(remote.auditLogs);
    setSettings(normalizeSettings(remote.settings));
    setCurrentUser(resolvedCurrentUser);
  };

  useEffect(() => {
    let active = true;
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

    const hydrate = async () => {
      if (!isSupabaseConfigured) {
        if (active) {
          setUsers([]);
          setWarrants([]);
          setAuditLogs([]);
          setCurrentUser(null);
          setSettings(DEFAULT_SETTINGS);
          setIsLoading(false);
        }
        return;
      }

      const profile = await getAuthenticatedProfile();
      if (!active) return;

      if (!profile) {
        setUsers([]);
        setWarrants([]);
        setAuditLogs([]);
        setCurrentUser(null);
        setSettings(DEFAULT_SETTINGS);
        setIsLoading(false);
        return;
      }

      await applyRemoteState(normalizeUser(profile));
      if (active) {
        setIsLoading(false);
      }
    };

    void hydrate();

    const subscription = subscribeToAuthChanges(async (_event, session) => {
      if (!active) return;

      if (!session?.user) {
        setCurrentUser(null);
        setUsers([]);
        setWarrants([]);
        setAuditLogs([]);
        setSettings(DEFAULT_SETTINGS);
        setIsLoading(false);
        return;
      }

      const profile = await getAuthenticatedProfile();
      if (!active) return;

      if (!profile) {
        setCurrentUser(null);
        setUsers([]);
        setWarrants([]);
        setAuditLogs([]);
        setSettings(DEFAULT_SETTINGS);
        setIsLoading(false);
        return;
      }

      await applyRemoteState(normalizeUser(profile));
      if (active) {
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

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

  const login = async (email: string, password: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const found = await authenticateWithSupabase(normalizedEmail, password);

    if (!found.ok || !found.user) {
      return { ok: false, message: found.message || 'Invalid email or password.' };
    }

    if (found.user.status === 'Inactive') {
      await signOutFromSupabase();
      return { ok: false, message: 'Your account is inactive. Please contact an administrator.' };
    }

    await applyRemoteState(normalizeUser(found.user));
    return { ok: true };
  };

  const registerAccount = async ({ fullName, email, password }: RegisterPayload): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const normalized = email.trim().toLowerCase();

    if (!fullName.trim() || !normalized || !password.trim()) {
      return { ok: false, message: 'All registration fields are required.' };
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(normalized)) {
      return { ok: false, message: 'Please enter a valid email address.' };
    }

    const result = await registerWithSupabaseAuth(fullName.trim(), normalized, password);
    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    const profile = await getAuthenticatedProfile();
    if (profile) {
      await applyRemoteState(normalizeUser(profile));
    }

    setAuditLogs((prev) => [
      {
        id: generateId(),
        user: fullName.trim(),
        action: 'Created warrant officer account',
        module: 'Registration',
        dateTime: now(),
        ipAddress: '127.0.0.1',
      },
      ...prev,
    ]);

    return { ok: true, message: result.message || 'Account created successfully.' };
  };

  const resetPassword = async (email: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      return { ok: false, message: 'Email is required.' };
    }

    const result = await sendPasswordResetEmail(normalized);
    return result.ok
      ? { ok: true, message: result.message }
      : { ok: false, message: result.message };
  };

  const completePasswordReset = async (password: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    if (!password.trim()) {
      return { ok: false, message: 'New password is required.' };
    }

    const result = await updateAuthenticatedPassword(password);
    return result.ok
      ? { ok: true, message: result.message }
      : { ok: false, message: result.message };
  };

  const logout = async () => {
    if (currentUser) {
      logAction('Logged out of the system', 'Authentication');
    }
    await signOutFromSupabase();
    setCurrentUser(null);
    setUsers([]);
    setWarrants([]);
    setAuditLogs([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const updateCurrentProfile = async ({ fullName, password }: UpdateProfilePayload): Promise<LoginResult> => {
    if (!currentUser) {
      return { ok: false, message: 'No active session found.' };
    }

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      return { ok: false, message: 'Full name is required.' };
    }

    const updatedUser: User = {
      ...currentUser,
      fullName: trimmedName,
    };

    const savedProfile = await saveUserToSupabase(updatedUser);
    if (!savedProfile.ok) {
      return { ok: false, message: `Unable to update profile in Supabase: ${savedProfile.message}` };
    }

    if (password?.trim()) {
      const passwordResult = await updateAuthenticatedPassword(password);
      if (!passwordResult.ok) {
        return { ok: false, message: passwordResult.message };
      }
    }

    setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    setCurrentUser(updatedUser);
    logAction('Updated own profile information', 'Profile');
    return { ok: true, message: 'Profile updated successfully.' };
  };

  const saveSettings = async (payload: Omit<AppSettings, 'id'>): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const nextSettings = normalizeSettings({ id: 'global', ...payload });
    const saved = await saveSettingsToSupabase(nextSettings);
    if (!saved.ok) {
      return { ok: false, message: `Unable to save settings in Supabase: ${saved.message}` };
    }

    setSettings(nextSettings);
    logAction('Updated system settings', 'Settings');
    return { ok: true, message: 'Settings saved successfully.' };
  };

  const addWarrant = async (warrant: NewWarrantPayload): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const createdByAdmin = currentUser?.role === 'Admin';
    const newWarrant: Warrant = {
      ...warrant,
      id: generateId(),
      status: 'Pending',
      approvalStatus: createdByAdmin ? 'Approved' : 'For Approval',
      submittedBy: currentUser?.fullName ?? 'System',
      submittedAt: now(),
      approvedBy: createdByAdmin ? currentUser?.fullName ?? 'System' : undefined,
      approvedAt: createdByAdmin ? now() : undefined,
      dateAssigned: warrant.dateAssigned || new Date().toISOString().slice(0, 10),
    };

    const saved = await saveWarrantToSupabase(newWarrant);
    if (!saved.ok) {
      return {
        ok: false,
        message: `Unable to save warrant in Supabase: ${saved.message}`,
      };
    }

    setWarrants((prev) => [newWarrant, ...prev]);
    logAction(
      createdByAdmin
        ? `Added and approved new warrant for ${warrant.name}`
        : `Submitted new warrant for ${warrant.name} for admin approval`,
      'Warrant Encoding',
    );
    return {
      ok: true,
      message: createdByAdmin
        ? 'Warrant successfully encoded and approved.'
        : 'Warrant submitted successfully and is waiting for admin approval.',
    };
  };

  const updateWarrant = async (warrantId: string, payload: Partial<Warrant>): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const target = warrants.find((w) => w.id === warrantId);
    if (!target) {
      return { ok: false, message: 'Warrant record not found.' };
    }

    const updatedWarrant = normalizeWarrant({ ...target, ...payload, id: warrantId });
    const saved = await saveWarrantToSupabase(updatedWarrant);
    if (!saved.ok) {
      return { ok: false, message: `Unable to update warrant in Supabase: ${saved.message}` };
    }

    setWarrants((prev) => prev.map((w) => (w.id === warrantId ? updatedWarrant : w)));
    logAction('Updated warrant details', 'Warrant Records');
    return { ok: true, message: 'Warrant details updated successfully.' };
  };

  const deleteWarrant = async (warrantId: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const target = warrants.find((w) => w.id === warrantId);
    if (!target) {
      return { ok: false, message: 'Warrant record not found.' };
    }

    const result = await deleteWarrantById(warrantId);
    if (!result.ok) {
      return { ok: false, message: `Unable to delete warrant in Supabase: ${result.message}` };
    }

    setWarrants((prev) => prev.filter((w) => w.id !== warrantId));
    logAction(`Deleted warrant record for ${target.name}`, 'Warrant Records');
    return { ok: true, message: 'Warrant deleted successfully.' };
  };

  const assignWarrant = async ({ warrantId, officerName, dateAssigned, notes }: AssignPayload): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const target = warrants.find((w) => w.id === warrantId);
    if (!target) {
      return { ok: false, message: 'Warrant record not found.' };
    }

    const updatedWarrant: Warrant = {
      ...target,
      assignedOfficer: officerName,
      dateAssigned,
      assignmentNotes: notes,
      status: 'Pending',
    };

    const saved = await saveWarrantToSupabase(updatedWarrant);
    if (!saved.ok) {
      return { ok: false, message: `Unable to assign warrant in Supabase: ${saved.message}` };
    }

    setWarrants((prev) => prev.map((w) => (w.id === warrantId ? updatedWarrant : w)));
    logAction(`Assigned warrant (${target.caseNumber}) to ${officerName}`, 'Warrant Assignment');
    return { ok: true, message: `Warrant assigned to ${officerName}.` };
  };

  const updateWarrantStatus = async ({
    warrantId,
    status,
    served,
    unserved,
  }: UpdateStatusPayload): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const target = warrants.find((w) => w.id === warrantId);
    if (!target) {
      return { ok: false, message: 'Warrant record not found.' };
    }

    let updatedWarrant: Warrant;
    if (status === 'Served') {
      updatedWarrant = {
        ...target,
        status,
        dateServed: served?.dateServed || '',
        placeServed: served?.placeServed || '',
        servedRemarks: served?.remarks || '',
        reasonUnserved: '',
        nextAction: '',
      };
    } else if (status === 'Unserved') {
      updatedWarrant = {
        ...target,
        status,
        reasonUnserved: unserved?.reasonUnserved || '',
        nextAction: unserved?.nextAction || '',
        dateServed: '',
        placeServed: '',
        servedRemarks: '',
      };
    } else {
      updatedWarrant = {
        ...target,
        status,
        dateServed: '',
        placeServed: '',
        servedRemarks: '',
        reasonUnserved: '',
        nextAction: '',
      };
    }

    const saved = await saveWarrantToSupabase(updatedWarrant);
    if (!saved.ok) {
      return { ok: false, message: `Unable to update warrant status in Supabase: ${saved.message}` };
    }

    setWarrants((prev) => prev.map((w) => (w.id === warrantId ? updatedWarrant : w)));
    logAction(`Updated warrant status to ${status} for ${target.caseNumber}`, 'Warrant Status');
    return { ok: true, message: `Warrant status updated to ${status}.` };
  };

  const addUser = async (_payload: AddUserPayload): Promise<LoginResult> => {
    return {
      ok: false,
      message: 'Direct account creation from the browser is disabled for security. New users should register through the Register page.',
    };
  };

  const approveWarrant = async (warrantId: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    if (currentUser?.role !== 'Admin') {
      return { ok: false, message: 'Only admins can approve warrant submissions.' };
    }

    const target = warrants.find((w) => w.id === warrantId);
    if (!target) {
      return { ok: false, message: 'Warrant record not found.' };
    }

    const updatedWarrant: Warrant = {
      ...target,
      approvalStatus: 'Approved',
      approvedBy: currentUser.fullName,
      approvedAt: now(),
    };

    const saved = await saveWarrantToSupabase(updatedWarrant);
    if (!saved.ok) {
      return { ok: false, message: `Unable to approve warrant in Supabase: ${saved.message}` };
    }

    setWarrants((prev) => prev.map((w) => (w.id === warrantId ? updatedWarrant : w)));
    logAction(`Approved warrant submission for ${target.caseNumber}`, 'Warrant Approval');
    return { ok: true, message: 'Warrant approved successfully.' };
  };

  const editUser = async (
    userId: string,
    payload: Partial<User>,
  ): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const target = users.find((user) => user.id === userId);
    if (!target) {
      return { ok: false, message: 'User not found.' };
    }

    const updatedUser: User = normalizeUser({
      ...target,
      ...payload,
      id: userId,
      email: target.email,
    });

    const saved = await saveUserToSupabase(updatedUser);
    if (!saved.ok) {
      return { ok: false, message: `Unable to update user in Supabase: ${saved.message}` };
    }

    setUsers((prev) => prev.map((user) => (user.id === userId ? updatedUser : user)));
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }
    logAction('Updated user account details', 'User Management');
    return { ok: true, message: 'User updated successfully.' };
  };

  const deactivateUser = async (userId: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const target = users.find((user) => user.id === userId);
    if (!target) {
      return { ok: false, message: 'User not found.' };
    }

    const updatedUser: User = {
      ...target,
      status: 'Inactive',
    };

    const saved = await saveUserToSupabase(updatedUser);
    if (!saved.ok) {
      return { ok: false, message: `Unable to deactivate user in Supabase: ${saved.message}` };
    }

    setUsers((prev) => prev.map((user) => (user.id === userId ? updatedUser : user)));
    if (currentUser?.id === userId) {
      setCurrentUser(updatedUser);
    }
    logAction(`Deactivated user ${target.fullName}`, 'User Management');
    return { ok: true, message: `User ${target.fullName} deactivated.` };
  };

  const pendingNotifications = useMemo(() => {
    const submittedForApproval =
      currentUser?.role === 'Admin'
        ? warrants.filter((w) => w.approvalStatus === 'For Approval').length
        : 0;

    return warrants.filter((w) => w.status === 'Pending').length + submittedForApproval;
  }, [currentUser?.role, warrants]);

  const overdueCount = useMemo(() => {
    const today = new Date();
    return warrants.filter((w) => {
      if (w.status !== 'Pending') return false;
      const issuedDate = new Date(w.dateIssued);
      const days = Math.floor((today.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 30;
    }).length;
  }, [warrants]);

  const urgentCount = useMemo(() => {
    let count = warrants.filter((w) => w.status === 'Unserved').length;
    if (settings.notifyPending) {
      count += pendingNotifications;
    }
    if (settings.notifyOverdue) {
      count += overdueCount;
    }
    return count;
  }, [overdueCount, pendingNotifications, settings.notifyOverdue, settings.notifyPending, warrants]);

  const value: SystemContextValue = {
    isLoading,
    isBackendReady: isSupabaseConfigured,
    backendMessage: isSupabaseConfigured ? null : SUPABASE_REQUIRED_MESSAGE,
    currentUser,
    warrants,
    users,
    auditLogs,
    settings,
    urgentCount,
    overdueCount,
    login,
    registerAccount,
    resetPassword,
    completePasswordReset,
    updateCurrentProfile,
    saveSettings,
    logout,
    addWarrant,
    updateWarrant,
    deleteWarrant,
    assignWarrant,
    approveWarrant,
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
