-- Warrant Management System - Supabase bootstrap schema
-- Run this in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.app_users (
  id text primary key,
  "fullName" text not null,
  username text not null unique,
  password text not null,
  role text not null check (role in ('Admin', 'Warrant Officer', 'Station Commander')),
  status text not null check (status in ('Active', 'Inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
  remarks text,
  "dateServed" date,
  "placeServed" text,
  "servedRemarks" text,
  "reasonUnserved" text,
  "nextAction" text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  "user" text not null,
  action text not null,
  module text not null,
  "dateTime" text not null,
  "ipAddress" text,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
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

alter table public.app_users enable row level security;
alter table public.warrants enable row level security;
alter table public.audit_logs enable row level security;

-- Demo policies: allow anon/authenticated full access.
-- Replace with stricter role-based policies in production.
drop policy if exists app_users_all on public.app_users;
create policy app_users_all on public.app_users
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists warrants_all on public.warrants;
create policy warrants_all on public.warrants
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists audit_logs_all on public.audit_logs;
create policy audit_logs_all on public.audit_logs
for all
to anon, authenticated
using (true)
with check (true);
