-- Warrant Management System - Supabase secure bootstrap schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id text primary key,
  "fullName" text not null,
  email text not null unique,
  role text not null default 'Warrant Officer' check (role in ('Admin', 'Warrant Officer')),
  status text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users
  add column if not exists "fullName" text;

alter table public.app_users
  add column if not exists email text;

alter table public.app_users
  add column if not exists role text default 'Warrant Officer';

alter table public.app_users
  add column if not exists status text default 'Active';

alter table public.app_users
  drop column if exists password;

update public.app_users
set role = 'Warrant Officer'
where role not in ('Admin', 'Warrant Officer') or role is null;

update public.app_users
set status = 'Active'
where status not in ('Active', 'Inactive') or status is null;

alter table public.app_users
  drop constraint if exists app_users_role_check;

alter table public.app_users
  add constraint app_users_role_check
  check (role in ('Admin', 'Warrant Officer'));

alter table public.app_users
  drop constraint if exists app_users_status_check;

alter table public.app_users
  add constraint app_users_status_check
  check (status in ('Active', 'Inactive'));

create unique index if not exists idx_app_users_email on public.app_users (email);

create table if not exists public.warrants (
  id text primary key,
  name text not null,
  alias text,
  "caseNumber" text not null,
  offense text not null,
  court text,
  judge text,
  "dateIssued" date not null,
  barangay text,
  address text,
  "assignedOfficer" text,
  "dateAssigned" date,
  "assignmentNotes" text,
  status text not null check (status in ('Pending', 'Served', 'Unserved', 'Cancelled')),
  "approvalStatus" text not null default 'For Approval' check ("approvalStatus" in ('For Approval', 'Approved')),
  "submittedBy" text,
  "submittedAt" text,
  "approvedBy" text,
  "approvedAt" text,
  remarks text,
  "dateServed" date,
  "placeServed" text,
  "servedRemarks" text,
  "reasonUnserved" text,
  "nextAction" text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.warrants add column if not exists "approvalStatus" text;
alter table public.warrants add column if not exists "submittedBy" text;
alter table public.warrants add column if not exists "submittedAt" text;
alter table public.warrants add column if not exists "approvedBy" text;
alter table public.warrants add column if not exists "approvedAt" text;

update public.warrants
set "approvalStatus" = 'Approved'
where "approvalStatus" is null;

alter table public.warrants
  alter column "approvalStatus" set default 'For Approval';

alter table public.warrants
  alter column "approvalStatus" set not null;

alter table public.warrants
  drop constraint if exists warrants_approval_status_check;

alter table public.warrants
  add constraint warrants_approval_status_check
  check ("approvalStatus" in ('For Approval', 'Approved'));

create table if not exists public.audit_logs (
  id text primary key,
  "user" text not null,
  action text not null,
  module text not null,
  "dateTime" text not null,
  "ipAddress" text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id text primary key,
  "officeName" text not null default 'Butuan City Police Station 1',
  "notifyOverdue" boolean not null default true,
  "notifyPending" boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, "officeName", "notifyOverdue", "notifyPending")
values ('global', 'Butuan City Police Station 1', true, true)
on conflict (id) do nothing;

create index if not exists idx_warrants_status on public.warrants (status);
create index if not exists idx_warrants_date_issued on public.warrants ("dateIssued");
create index if not exists idx_audit_logs_datetime on public.audit_logs ("dateTime");

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, "fullName", email, role, status)
  values (
    new.id::text,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    lower(new.email),
    'Warrant Officer',
    'Active'
  )
  on conflict (email) do update
  set
    id = excluded.id,
    "fullName" = excluded."fullName",
    email = excluded.email;

  return new;
end;
$$;

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.app_users
  set email = lower(new.email)
  where id = new.id::text;
  return new;
end;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_users
  where id = auth.uid()::text
  limit 1;
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_users
    where id = auth.uid()::text
      and status = 'Active'
  );
$$;

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_warrants_updated_at on public.warrants;
create trigger trg_warrants_updated_at
before update on public.warrants
for each row
execute function public.set_updated_at();

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
after update of email on auth.users
for each row
execute function public.sync_user_email();

alter table public.app_users enable row level security;
alter table public.warrants enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists app_users_select on public.app_users;
create policy app_users_select on public.app_users
for select
to authenticated
using (public.is_active_user());

drop policy if exists app_users_update_self_or_admin on public.app_users;
create policy app_users_update_self_or_admin on public.app_users
for update
to authenticated
using (
  public.is_active_user()
  and (id = auth.uid()::text or public.current_app_role() = 'Admin')
)
with check (
  public.is_active_user()
  and (id = auth.uid()::text or public.current_app_role() = 'Admin')
);

drop policy if exists warrants_select_active_users on public.warrants;
create policy warrants_select_active_users on public.warrants
for select
to authenticated
using (public.is_active_user());

drop policy if exists warrants_insert_active_users on public.warrants;
create policy warrants_insert_active_users on public.warrants
for insert
to authenticated
with check (public.is_active_user());

drop policy if exists warrants_update_admin_only on public.warrants;
create policy warrants_update_admin_only on public.warrants
for update
to authenticated
using (public.current_app_role() = 'Admin')
with check (public.current_app_role() = 'Admin');

drop policy if exists warrants_delete_admin_only on public.warrants;
create policy warrants_delete_admin_only on public.warrants
for delete
to authenticated
using (public.current_app_role() = 'Admin');

drop policy if exists audit_logs_select_admin_only on public.audit_logs;
create policy audit_logs_select_admin_only on public.audit_logs
for select
to authenticated
using (public.current_app_role() = 'Admin');

drop policy if exists audit_logs_insert_active_users on public.audit_logs;
create policy audit_logs_insert_active_users on public.audit_logs
for insert
to authenticated
with check (public.is_active_user());

drop policy if exists app_settings_select_active_users on public.app_settings;
create policy app_settings_select_active_users on public.app_settings
for select
to authenticated
using (public.is_active_user());

drop policy if exists app_settings_update_admin_only on public.app_settings;
create policy app_settings_update_admin_only on public.app_settings
for update
to authenticated
using (public.current_app_role() = 'Admin')
with check (public.current_app_role() = 'Admin');

-- To promote the first admin after sign-up, run this once in SQL Editor:
-- update public.app_users
-- set role = 'Admin'
-- where email = 'admin@example.com';
