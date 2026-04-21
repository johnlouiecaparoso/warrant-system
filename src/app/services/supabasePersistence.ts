import { AuditLog, User, Warrant } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';

interface PersistPayload {
  users: User[];
  warrants: Warrant[];
  auditLogs: AuditLog[];
}

function withoutUndefined<T extends Record<string, unknown>>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== undefined));
}

export async function loadFromSupabase(): Promise<PersistPayload | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const [usersResult, warrantsResult, logsResult] = await Promise.all([
    supabase.from('app_users').select('*').order('fullName', { ascending: true }),
    supabase.from('warrants').select('*').order('dateIssued', { ascending: false }),
    supabase.from('audit_logs').select('*').order('dateTime', { ascending: false }),
  ]);

  if (usersResult.error || warrantsResult.error || logsResult.error) {
    return null;
  }

  return {
    users: usersResult.data as User[],
    warrants: warrantsResult.data as Warrant[],
    auditLogs: logsResult.data as AuditLog[],
  };
}

export async function authenticateWithSupabase(username: string, password: string): Promise<User | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .single();

  if (error || !data) {
    return null;
  }

  return data as User;
}

export async function upsertUsers(users: User[]) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('app_users').upsert(users.map((u) => withoutUndefined(u)), { onConflict: 'id' });
}

export async function upsertWarrants(warrants: Warrant[]) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('warrants').upsert(warrants.map((w) => withoutUndefined(w)), { onConflict: 'id' });
}

export async function upsertAuditLogs(logs: AuditLog[]) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('audit_logs').upsert(logs.map((l) => withoutUndefined(l)), { onConflict: 'id' });
}

export async function deleteWarrantById(id: string) {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('warrants').delete().eq('id', id);
}
