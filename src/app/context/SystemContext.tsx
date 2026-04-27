import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppSettings, AuditLog, User, Warrant } from '../data/models';
import {
  authenticateWithSupabase,
  createWarrantInSupabase,
  createWarrantPhotoSignedUrl,
  deleteWarrantById,
  getAuthenticatedProfile,
  getProfileById,
  hasAuthenticatedSession,
  loadAuditLogsFromSupabase,
  loadCoreFromSupabase,
  registerWithSupabaseAuth,
  saveSettingsToSupabase,
  saveUserToSupabase,
  sendPasswordResetEmail,
  signOutFromSupabase,
  subscribeToAuthChanges,
  updateAuthenticatedPassword,
  updateWarrantInSupabase,
  uploadWarrantPhoto,
  upsertAuditLogs,
} from '../services/supabasePersistence';
import { isSupabaseConfigured } from '../../lib/supabase';
import { isDisplayPending } from '../lib/warrantStatus';

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
  'id' | 'status' | 'approvalStatus' | 'submittedById' | 'submittedBy' | 'submittedAt' | 'approvedBy' | 'approvedAt'
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
    photoDataUrl: warrant.photoDataUrl,
    photoPath: warrant.photoPath,
    photoUrl: warrant.photoUrl,
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
    submittedById: warrant.submittedById,
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
  const [runtimeMessage, setRuntimeMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [warrants, setWarrants] = useState<Warrant[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const failSafeReset = (message?: string | null) => {
    setUsers([]);
    setWarrants([]);
    setAuditLogs([]);
    setCurrentUser(null);
    setSettings(DEFAULT_SETTINGS);
    setRuntimeMessage(message ?? null);
  };

  const ownsWarrant = (warrant: Warrant) => {
    if (currentUser?.role !== 'Warrant Officer') return false;
    if (warrant.submittedById) {
      return warrant.submittedById === currentUser.id;
    }
    return (warrant.submittedBy || '').trim().toLowerCase() === currentUser.fullName.trim().toLowerCase();
  };

  const isAwaitingApproval = (warrant: Warrant) => warrant.approvalStatus === 'For Approval';

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, message: string): Promise<T> => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error(message)), ms);
        }),
      ]);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const runBackendAction = async <T,>(
    action: () => Promise<T>,
    timeoutMessage: string,
    timeoutMs = 12000,
  ): Promise<T> => withTimeout(action(), timeoutMs, timeoutMessage);

  const hydrateWarrantPhotoUrls = async (items: Warrant[]) => {
    const next = await Promise.all(
      items.map(async (warrant) => {
        if (!warrant.photoPath) {
          return warrant;
        }

        const signedUrl = await createWarrantPhotoSignedUrl(warrant.photoPath);
        return { ...warrant, photoUrl: signedUrl ?? warrant.photoUrl };
      }),
    );

    setWarrants(next);
  };

  const applyCoreRemoteState = async (profileOverride?: User | null) => {
    const remote = await loadCoreFromSupabase();
    if (!remote) {
      setUsers([]);
      setWarrants([]);
      setAuditLogs([]);
      setSettings(DEFAULT_SETTINGS);
      setCurrentUser(profileOverride ?? null);
      setRuntimeMessage('Supabase is reachable, but the system data could not be loaded. Check your tables, RLS policies, and API keys.');
      return;
    }

    const normalizedUsers = remote.users.map((user) => normalizeUser(user));
    const resolvedCurrentUser =
      profileOverride ??
      (currentUser
        ? normalizedUsers.find((user) => user.id === currentUser.id) ?? null
        : null);

    const normalizedWarrants = remote.warrants.map((warrant) => normalizeWarrant(warrant));

    setUsers(normalizedUsers);
    setWarrants(normalizedWarrants);
    setSettings(normalizeSettings(remote.settings));
    setCurrentUser(resolvedCurrentUser);
    setRuntimeMessage(null);
    void hydrateWarrantPhotoUrls(normalizedWarrants);
  };

  const refreshAuditLogs = async (profileOverride?: User | null) => {
    if ((profileOverride ?? currentUser)?.role !== 'Admin') {
      setAuditLogs([]);
      return;
    }

    const logs = await loadAuditLogsFromSupabase();
    setAuditLogs(logs);
  };

  useEffect(() => {
    let active = true;
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));

    const hydrate = async () => {
      if (!isSupabaseConfigured) {
        if (active) {
          failSafeReset(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const hasSession = await withTimeout(
          hasAuthenticatedSession(),
          12000,
          'Timed out while checking the active login session.',
        );
        if (!active) return;

        if (!hasSession) {
          failSafeReset(null);
          return;
        }

        const profile = await withTimeout(
          getAuthenticatedProfile(),
          12000,
          'Timed out while restoring the saved login session.',
        );
        if (!active) return;

        if (!profile) {
          failSafeReset('A login session was found, but the user profile could not be loaded from Supabase.');
          return;
        }

        const normalizedProfile = normalizeUser(profile);
        await withTimeout(
          applyCoreRemoteState(normalizedProfile),
          12000,
          'Timed out while loading your workspace from Supabase.',
        );
        if (!active) return;
        void refreshAuditLogs(normalizedProfile);
      } catch (error) {
        if (active) {
          const message =
            error instanceof Error
              ? error.message
              : 'The system could not finish startup. Please check your Supabase connection and schema.';
          failSafeReset(message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void hydrate();

    const subscription = subscribeToAuthChanges((event, session) => {
      if (!active) return;

      window.setTimeout(() => {
        void (async () => {
          try {
            if (!session?.user) {
              if (event === 'SIGNED_OUT') {
                failSafeReset(null);
              }
              return;
            }

            const profile = await withTimeout(
              getProfileById(session.user.id),
              20000,
              'Timed out while refreshing the signed-in profile.',
            );
            if (!active) return;

            if (!profile) {
              setRuntimeMessage('A login session was found, but the user profile could not be loaded from Supabase.');
              return;
            }

            const normalizedProfile = normalizeUser(profile);
            setCurrentUser(normalizedProfile);
            await withTimeout(
              applyCoreRemoteState(normalizedProfile),
              20000,
              'Timed out while refreshing system data from Supabase.',
            );
            if (!active) return;
            void refreshAuditLogs(normalizedProfile);
          } catch (error) {
            if (active) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'The system could not refresh its data after the sign-in state changed.';
              setRuntimeMessage(message);
            }
          } finally {
            if (active) {
              setIsLoading(false);
            }
          }
        })();
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const persistAuditLog = async (entry: AuditLog) => {
    if (!isSupabaseConfigured) return;

    await upsertAuditLogs([entry]);
    if (currentUser?.role === 'Admin') {
      await refreshAuditLogs(currentUser);
    }
  };

  const logAction = (action: string, module: string, actorOverride?: string) => {
    const actor = actorOverride ?? currentUser?.fullName ?? 'System';
    const entry: AuditLog = {
      id: generateId(),
      user: actor,
      action,
      module,
      dateTime: now(),
      ipAddress: '127.0.0.1',
    };
    void persistAuditLog(entry);
  };

  const canOfficerModifyWarrant = (warrant: Warrant) =>
    ownsWarrant(warrant);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    if (!isSupabaseConfigured) {
      return { ok: false, message: SUPABASE_REQUIRED_MESSAGE };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const found = await runBackendAction(
      () => authenticateWithSupabase(normalizedEmail, password),
      'Timed out while signing in. Please check your connection and Supabase auth settings.',
    );

    if (!found.ok || !found.user) {
      return { ok: false, message: found.message || 'Invalid email or password.' };
    }

    if (found.user.status === 'Inactive') {
      await signOutFromSupabase();
      return { ok: false, message: 'Your account is inactive. Please contact an administrator.' };
    }

    setCurrentUser(normalizeUser(found.user));
    setRuntimeMessage(null);
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

    const result = await runBackendAction(
      () => registerWithSupabaseAuth(fullName.trim(), normalized, password),
      'Timed out while creating the account. Please try again.',
    );
    if (!result.ok) {
      return { ok: false, message: result.message };
    }

    const profile = await getAuthenticatedProfile();
    if (profile) {
      await applyCoreRemoteState(normalizeUser(profile));
      void refreshAuditLogs(normalizeUser(profile));
    }

    logAction('Created warrant officer account', 'Registration', fullName.trim());

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

    const result = await runBackendAction(
      () => sendPasswordResetEmail(normalized),
      'Timed out while sending the reset email. Please try again.',
    );
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

    const result = await runBackendAction(
      () => updateAuthenticatedPassword(password),
      'Timed out while updating the password. Please try again.',
    );
    return result.ok
      ? { ok: true, message: result.message }
      : { ok: false, message: result.message };
  };

  const logout = async () => {
    if (currentUser) {
      logAction('Logged out of the system', 'Authentication');
    }
    await runBackendAction(
      () => signOutFromSupabase(),
      'Timed out while signing out. Please refresh the page and try again.',
    );
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

    const savedProfile = await runBackendAction(
      () => saveUserToSupabase(updatedUser),
      'Timed out while updating the profile. Please try again.',
    );
    if (!savedProfile.ok) {
      return { ok: false, message: `Unable to update profile in Supabase: ${savedProfile.message}` };
    }

    if (password?.trim()) {
      const passwordResult = await runBackendAction(
        () => updateAuthenticatedPassword(password),
        'Timed out while updating the password. Please try again.',
      );
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
    const saved = await runBackendAction(
      () => saveSettingsToSupabase(nextSettings),
      'Timed out while saving system settings. Please try again.',
    );
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
    const warrantId = generateId();
    let photoPath: string | undefined;

    if (warrant.photoDataUrl) {
      const uploadedPhoto = await runBackendAction(
        () => uploadWarrantPhoto(warrantId, warrant.photoDataUrl as string),
        'Timed out while uploading the warrant photo. Please try again.',
      );
      if (!uploadedPhoto.ok || !uploadedPhoto.path) {
        return {
          ok: false,
          message: `Unable to upload warrant photo to Supabase Storage: ${uploadedPhoto.message}`,
        };
      }
      photoPath = uploadedPhoto.path;
    }

    const photoUrl = photoPath
      ? await createWarrantPhotoSignedUrl(photoPath)
      : warrant.photoDataUrl;
    const newWarrant: Warrant = {
      ...warrant,
      id: warrantId,
      status: 'Pending',
      approvalStatus: createdByAdmin ? 'Approved' : 'For Approval',
      photoPath,
      photoUrl: photoUrl ?? undefined,
      photoDataUrl: undefined,
      submittedById: currentUser?.id ?? undefined,
      submittedBy: currentUser?.fullName ?? 'System',
      submittedAt: now(),
      approvedBy: createdByAdmin ? currentUser?.fullName ?? 'System' : undefined,
      approvedAt: createdByAdmin ? now() : undefined,
      dateAssigned: warrant.dateAssigned || new Date().toISOString().slice(0, 10),
    };

    const saved = await runBackendAction(
      () => createWarrantInSupabase(newWarrant),
      'Timed out while saving the warrant. Please try again.',
    );
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
      'Add Warrant',
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
    if (!canOfficerModifyWarrant(target)) {
      return { ok: false, message: 'You can only edit warrants you submitted.' };
    }

    const updatedWarrant = normalizeWarrant({ ...target, ...payload, id: warrantId });
    const saved = await runBackendAction(
      () => updateWarrantInSupabase(updatedWarrant),
      'Timed out while updating the warrant. Please try again.',
    );
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
    if (!canOfficerModifyWarrant(target)) {
      return { ok: false, message: 'You can only delete warrants you submitted.' };
    }

    const result = await runBackendAction(
      () => deleteWarrantById(warrantId),
      'Timed out while deleting the warrant. Please try again.',
    );
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

    const saved = await runBackendAction(
      () => updateWarrantInSupabase(updatedWarrant),
      'Timed out while assigning the warrant. Please try again.',
    );
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

    const saved = await runBackendAction(
      () => updateWarrantInSupabase(updatedWarrant),
      'Timed out while updating the warrant status. Please try again.',
    );
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
      status: target.status === 'Pending' ? 'Pending' : target.status,
      approvedBy: currentUser.fullName,
      approvedAt: now(),
    };

    const saved = await runBackendAction(
      () => updateWarrantInSupabase(updatedWarrant),
      'Timed out while approving the warrant. Please try again.',
    );
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

    const saved = await runBackendAction(
      () => saveUserToSupabase(updatedUser),
      'Timed out while updating the user account. Please try again.',
    );
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

    const saved = await runBackendAction(
      () => saveUserToSupabase(updatedUser),
      'Timed out while deactivating the user account. Please try again.',
    );
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
    if (currentUser?.role === 'Admin') {
      return warrants.filter(isAwaitingApproval).length;
    }

    if (currentUser?.role === 'Warrant Officer') {
      return warrants.filter((w) => ownsWarrant(w) && w.approvalStatus === 'Approved').length;
    }

    return 0;
  }, [currentUser?.role, warrants]);

  const overdueCount = useMemo(() => {
    const today = new Date();
    return warrants.filter((w) => {
      if (!isDisplayPending(w)) return false;
      const issuedDate = new Date(w.dateIssued);
      const days = Math.floor((today.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 30;
    }).length;
  }, [warrants]);

  const ownOverdueCount = useMemo(() => {
    if (currentUser?.role !== 'Warrant Officer') return 0;
    const today = new Date();
    return warrants.filter((w) => {
      if (!ownsWarrant(w) || !isDisplayPending(w)) return false;
      const issuedDate = new Date(w.dateIssued);
      const days = Math.floor((today.getTime() - issuedDate.getTime()) / (1000 * 60 * 60 * 24));
      return days > 30;
    }).length;
  }, [currentUser?.role, warrants]);

  const urgentCount = useMemo(() => {
    let count =
      currentUser?.role === 'Warrant Officer'
        ? warrants.filter((w) => ownsWarrant(w) && w.status === 'Unserved').length
        : warrants.filter((w) => w.status === 'Unserved').length;
    if (settings.notifyPending) {
      count += pendingNotifications;
    }
    if (settings.notifyOverdue) {
      count += currentUser?.role === 'Warrant Officer'
        ? ownOverdueCount
        : overdueCount;
    }
    return count;
  }, [currentUser?.role, overdueCount, ownOverdueCount, pendingNotifications, settings.notifyOverdue, settings.notifyPending, warrants]);

  const value: SystemContextValue = {
    isLoading,
    isBackendReady: isSupabaseConfigured,
    backendMessage: !isSupabaseConfigured ? SUPABASE_REQUIRED_MESSAGE : runtimeMessage,
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
