import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { useSystem } from './context/SystemContext';
import { User } from './data/models';
import { Layout } from './components/Layout';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const WarrantEncode = lazy(() => import('./pages/WarrantEncode').then((module) => ({ default: module.WarrantEncode })));
const WarrantList = lazy(() => import('./pages/WarrantList').then((module) => ({ default: module.WarrantList })));
const Search = lazy(() => import('./pages/Search').then((module) => ({ default: module.Search })));
const Reports = lazy(() => import('./pages/Reports').then((module) => ({ default: module.Reports })));
const UserManagement = lazy(() => import('./pages/UserManagement').then((module) => ({ default: module.UserManagement })));
const AuditLogs = lazy(() => import('./pages/AuditLogs').then((module) => ({ default: module.AuditLogs })));
const Settings = lazy(() => import('./pages/Settings').then((module) => ({ default: module.Settings })));

function RouteFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 px-6 text-center text-gray-600">
      <div className="space-y-2">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
        <p className="text-sm font-medium text-slate-700">Loading...</p>
      </div>
    </div>
  );
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useSystem();

  if (!isLoading) {
    if (currentUser) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}

function ProtectedLayout() {
  const { currentUser, isLoading } = useSystem();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-700">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

function RoleGuard({
  roles,
  children,
}: {
  roles: Array<User['role']>;
  children: React.ReactNode;
}) {
  const { currentUser } = useSystem();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedLayout />}>
              <Route index element={<Dashboard />} />
              <Route
                path="warrants/encode"
                element={
                  <RoleGuard roles={['Warrant Officer']}>
                    <WarrantEncode />
                  </RoleGuard>
                }
              />
              <Route path="warrants" element={<WarrantList />} />
              <Route path="search" element={<Search />} />
              <Route path="reports" element={<Reports />} />
              <Route
                path="users"
                element={
                  <RoleGuard roles={['Admin']}>
                    <UserManagement />
                  </RoleGuard>
                }
              />
              <Route
                path="audit-logs"
                element={
                  <RoleGuard roles={['Admin']}>
                    <AuditLogs />
                  </RoleGuard>
                }
              />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
