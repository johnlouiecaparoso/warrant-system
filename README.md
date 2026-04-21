
  # Warrant Management System

  This project is a React + Tailwind + shadcn frontend for a law-enforcement warrant management workflow.

  ## Features Implemented

  - Role-aware login and protected routes
  - Dashboard stats, charts, recent updates, urgent/overdue notifications
  - Warrant encoding, records, assignment, status updates, delete/edit flows
  - Search page with filter-based results
  - Reports with date range, print/PDF flow, and CSV export
  - User management (add/edit/deactivate) with search and pagination
  - Audit logs with search/filter/date filtering
  - Breadcrumbs, responsive layout, mobile menu, and logout confirmation

  ## Run Locally

  1. Install dependencies:
  `npm install`

  2. Start dev server:
  `npm run dev`

  3. Build production bundle:
  `npm run build`

  ## Authentication Demo Accounts (Local Mode)

  - `admin / admin`
  - `rsantos / commander123`
  - `pgarcia / officer123`

  ## Optional Supabase Mode

  The app supports optional Supabase-backed persistence.

  1. Copy `.env.example` to `.env`
  2. Set:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  3. Run SQL bootstrap script in Supabase SQL Editor:
  - `supabase/schema.sql`
  4. Ensure table column names match the app data models in `src/app/data/mockData.ts`

  If Supabase env vars are missing, the app automatically uses localStorage mode.
  