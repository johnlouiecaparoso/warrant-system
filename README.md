# Warrant Management System

This project is a React + Tailwind + shadcn frontend backed by Supabase for warrant management workflows.

## Features

- Supabase Auth login, registration, and email-based password recovery
- Role-aware protected routes for `Admin` and `Warrant Officer`
- Dashboard stats, charts, recent updates, and urgent notifications
- Warrant encoding, approval, assignment, status updates, edit/delete flows
- Search page with filter-based results
- Reports with date range, PDF export flow, and Excel-compatible export
- User management for admin role/status control
- Audit logs, responsive layout, mobile menu, and profile/settings management

## Run Locally

1. Install dependencies:
`npm install`

2. Start dev server:
`npm run dev`

3. Build production bundle:
`npm run build`

## Account Flow

- Public users create accounts in `/register`
- New accounts are created as:
  - `role = Warrant Officer`
  - `status = Active`
- Promote your first administrator in Supabase SQL after registration
- Admins manage roles/status in User Management

## Supabase Setup

The app reads and writes system data from Supabase only.

1. Copy `.env.example` to `.env`
2. Set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
3. In Supabase Authentication settings:
- enable Email provider
- configure your Site URL and redirect URLs
- add `http://localhost:5173/reset-password` for local development
- add your production `/reset-password` URL before deployment
4. If deploying to Vercel:
- add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Project Settings
- redeploy after changing environment variables
- make sure your production domain is added to Supabase Auth redirect URLs
5. Run the SQL bootstrap script in Supabase SQL Editor:
- `supabase/schema.sql`
6. Register your first account through the app, then promote it to admin in Supabase SQL Editor:
```sql
update public.app_users
set role = 'Admin'
where email = 'admin@example.com';
```
7. Ensure table column names match the app data models in `src/app/data/models.ts`

## Security Notes

- Passwords are managed by Supabase Auth, not stored in `public.app_users`
- The SQL schema includes role-aware row level security policies
- Warrant Officers can submit warrants but cannot approve, edit, delete, or update status directly through the database policies
- Admins can approve and manage warrants, users, audit logs, and settings

If Supabase env vars are missing, the app will stay empty and block login or data changes until configuration is completed.
