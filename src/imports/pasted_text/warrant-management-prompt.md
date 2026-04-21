# Figma Prompt: Web-Based Warrant Management and Monitoring System for Butuan City Police Station 1

Design a modern, professional, secure, and mobile-responsive web-based dashboard system for Butuan City Police Station 1.

The design must work smoothly on desktop, tablet, and mobile devices. Use a clean police-office style UI with blue, white, gray, and dark accents. The layout should look organized, formal, and easy to use.

The system should have a sidebar navigation on desktop and a collapsible hamburger menu on mobile. Use cards, tables, icons, search bars, filters, status badges, and modal forms.

## General UI Requirements

* Responsive design for desktop, tablet, and mobile
* Clean and professional government-style dashboard
* Left sidebar navigation on desktop
* Top navigation bar with user profile and notifications
* Mobile view with collapsible menu
* Use cards with rounded corners and soft shadows
* Use icons for dashboard, warrants, reports, users, settings, and logs
* Use status colors:

  * Pending = Orange
  * Served = Green
  * Unserved = Red
  * Cancelled = Gray
* Include tables with pagination and search filters
* Include modals for add, edit, assign, and update actions
* Add confirmation popups for delete and logout actions

---

## 1. Login and User Management Module

Create a secure login page with:

* Police Station logo at the top
* Username field
* Password field
* Login button
* Forgot password link
* Error message for invalid login
* Background image related to police station or office

After login, redirect users to the dashboard.

User roles:

* Admin
* Warrant Officer
* Station Commander

For User Management page, create:

* User table with columns:

  * Full Name
  * Username
  * Role
  * Status
  * Actions
* Buttons for Add User, Edit User, and Deactivate User
* Modal form for adding and editing users
* Status badge for Active and Inactive users

---

## 2. Dashboard Module

Create a dashboard overview page showing important warrant statistics.

Include summary cards for:

* Total Warrants
* Pending Warrants
* Served Warrants
* Unserved Warrants
* Cancelled Warrants

Below the cards, include:

* Line chart for monthly warrant activity
* Pie chart for warrant status distribution
* Recent activity panel
* Recent warrant updates table
* Notifications panel for urgent or overdue warrants

---

## 3. Warrant Encoding Module

Create a form page for encoding warrant information.

Form fields:

* Name of Accused
* Alias
* Case Number
* Offense
* Court
* Judge
* Date Issued
* Barangay
* Address
* Assigned Officer
* Remarks

Buttons:

* Save
* Clear
* Cancel

The form should be displayed inside a card layout with grouped sections and proper spacing.

For mobile view, form fields should stack vertically.

---

## 4. Warrant List and Record View Module

Create a warrant records page with a searchable and filterable table.

Table columns:

* Name
* Case Number
* Offense
* Status
* Assigned Officer
* Date Issued
* Actions

Actions include:

* View
* Edit
* Delete
* Assign Officer
* Update Status

Include:

* Search bar at the top
* Filters for status, barangay, offense, and date
* Pagination at the bottom
* Status badges with colors

On mobile view, transform the table into stacked cards for easier reading.

---

## 5. Warrant Assignment Module

Create an assignment screen or modal where Admin can assign a warrant to an officer.

Fields:

* Warrant Name
* Case Number
* Officer Dropdown List
* Date Assigned
* Notes

Buttons:

* Assign
* Cancel

After assignment:

* Officer name is saved
* Warrant status automatically changes to Pending

---

## 6. Warrant Status Update Module

Create a status update page or modal.

Status options:

* Pending
* Served
* Unserved
* Cancelled

If status is Served, additional fields appear:

* Date Served
* Place Served
* Remarks

If status is Unserved, include:

* Reason for Unserved
* Next Action

Include Save and Cancel buttons.

---

## 7. Search Module

Create a search page or global search bar.

Search filters:

* Name of Accused
* Case Number
* Barangay
* Offense
* Status
* Assigned Officer

Display search results in a table or card layout.

---

## 8. Reports Module

Create a reports page with printable report templates.

Types of reports:

* Daily Served Warrants
* Monthly Served Warrants
* Pending Warrants
* Unserved Warrants
* Cancelled Warrants

Include:

* Date range filter
* Export buttons for PDF and Excel
* Print button
* Table preview of reports
* Charts for report summaries

---

## 9. Audit Trail Module

Create an audit logs page to record all system actions.

Sample logs:

* Juan added new warrant
* Maria updated warrant status
* Admin deleted a record
* Officer assigned a warrant

Table columns:

* User
* Action
* Module
* Date and Time
* IP Address

Include search and filter options.

---

## Additional Design Requirements

* Use consistent spacing and typography
* Use modern sans-serif fonts
* Include breadcrumbs on every page
* Include loading states and empty states
* Add notification badges for pending tasks
* Use responsive cards and tables
* Make all pages easy to navigate and user-friendly
* Ensure the design is suitable for law enforcement office use

## Recommended Tech Stack

Frontend:

* React
* Tailwind CSS
* Shadcn UI
* React Router
* Recharts
* TanStack Table
* React Hook Form

Backend:

* Supabase
* PostgreSQL Database
* Supabase Authentication
* Row Level Security

Development Note:

* Build the frontend interface first using React and Tailwind CSS
* Use static or mock data during frontend development
* Integrate Supabase only after the frontend UI and pages are complete
* After integration, connect login, database records, user roles, search, reports, and audit logs to Supabase backend services

The system is intended to digitally store warrant records, assign officers, monitor the status of warrants, track activities, and generate reports to improve the efficiency and accuracy of warrant operations at Butuan City Police Station 1.
