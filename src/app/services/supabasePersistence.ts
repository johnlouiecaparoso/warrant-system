import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AppSettings, AuditLog, User, Warrant } from '../data/models';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface PersistPayload {
  users: User[];
  warrants: Warrant[];
  auditLogs: AuditLog[];
  settings: AppSettings | null;
}

function nullable(value: string | undefined) {
  return value ?? null;
}

function withoutUndefined<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

function toWarrantRow(warrant: Warrant) {
  return {
    id: warrant.id,
    name: warrant.name,
    alias: nullable(warrant.alias),
    caseNumber: warrant.caseNumber,
    offense: warrant.offense,
    court: nullable(warrant.court),
    judge: nullable(warrant.judge),
    dateIssued: warrant.dateIssued,
    barangay: nullable(warrant.barangay),
    address: nullable(warrant.address),
    assignedOfficer: nullable(warrant.assignedOfficer),
    dateAssigned: nullable(warrant.dateAssigned),
    assignmentNotes: nullable(warrant.assignmentNotes),
    status: warrant.status,
    approvalStatus: warrant.approvalStatus,
    submittedBy: nullable(warrant.submittedBy),
    submittedAt: nullable(warrant.submittedAt),
    approvedBy: nullable(warrant.approvedBy),
    approvedAt: nullable(warrant.approvedAt),
    remarks: nullable(warrant.remarks),
    dateServed: nullable(warrant.dateServed),
    placeServed: nullable(warrant.placeServed),
    servedRemarks: nullable(warrant.servedRemarks),
    reasonUnserved: nullable(warrant.reasonUnserved),
    nextAction: nullable(warrant.nextAction),
  };
}

async function getProfileById(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as User;
}

export async function loadFromSupabase(): Promise<PersistPayload | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const [usersResult, warrantsResult, logsResult, settingsResult] = await Promise.all([
    supabase.from('app_users').select('*').order('fullName', { ascending: true }),
    supabase.from('warrants').select('*').order('dateIssued', { ascending: false }),
    supabase.from('audit_logs').select('*').order('dateTime', { ascending: false }),
    supabase.from('app_settings').select('*').eq('id', 'global').maybeSingle(),
  ]);

  if (
    usersResult.error ||
    warrantsResult.error ||
    logsResult.error ||
    (settingsResult.error &&
      settingsResult.error.code !== 'PGRST116' &&
      settingsResult.error.code !== 'PGRST205' &&
      settingsResult.error.code !== '42P01')
  ) {
    return null;
  }

  return {
    users: usersResult.data as User[],
    warrants: warrantsResult.data as Warrant[],
    auditLogs: logsResult.data as AuditLog[],
    settings: (settingsResult.data as AppSettings | null) ?? null,
  };
}

export async function getAuthenticatedProfile(): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  return getProfileById(session.user.id);
}

export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  if (!isSupabaseConfigured || !supabase) {
    return { unsubscribe: () => undefined };
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return subscription;
}

export async function authenticateWithSupabase(
  email: string,
  password: string,
): Promise<{ ok: boolean; user?: User; message?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, message: error?.message || 'Invalid email or password.' };
  }

  const profile = await getProfileById(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    return { ok: false, message: 'No user profile found for this account.' };
  }

  return { ok: true, user: profile };
}

export async function registerWithSupabaseAuth(
  fullName: string,
  email: string,
  password: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  if (data.session) {
    return { ok: true, message: 'Account created successfully.' };
  }

  return {
    ok: true,
    message: 'Account created. Please check your email and confirm your account before logging in.',
  };
}

export async function sendPasswordResetEmail(
  email: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: 'Password reset email sent. Please check your inbox.' };
}

export async function updateAuthenticatedPassword(
  password: string,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: 'Supabase is not configured.' };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: 'Password updated successfully.' };
}

export async function signOutFromSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.auth.signOut();
}

export async function saveUserToSupabase(user: User): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: true };

  const { error } = await supabase
    .from('app_users')
    .update(withoutUndefined(user))
    .eq('id', user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function upsertWarrants(warrants: Warrant[]) {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from('warrants')
    .upsert(warrants.map((w) => toWarrantRow(w)), { onConflict: 'id' });
  if (error) {
    console.error('Failed to sync warrants to Supabase:', error.message);
  }
}

export async function saveWarrantToSupabase(
  warrant: Warrant,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: true };

  const { error } = await supabase
    .from('warrants')
    .upsert(toWarrantRow(warrant), { onConflict: 'id' });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function saveSettingsToSupabase(
  settings: AppSettings,
): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: true };

  const { error } = await supabase
    .from('app_settings')
    .update(withoutUndefined(settings))
    .eq('id', settings.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}

export async function upsertAuditLogs(logs: AuditLog[]) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('audit_logs').upsert(logs.map((l) => withoutUndefined(l)), { onConflict: 'id' });
}

export async function deleteWarrantById(id: string): Promise<{ ok: boolean; message?: string }> {
  if (!isSupabaseConfigured || !supabase) return { ok: true };

  const { error } = await supabase.from('warrants').delete().eq('id', id);
  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
