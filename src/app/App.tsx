import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { useSystem } from './context/SystemContext';
import { User } from './data/models';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { WarrantEncode } from './pages/WarrantEncode';
import { WarrantList } from './pages/WarrantList';
import { Search } from './pages/Search';
import { Reports } from './pages/Reports';
import { UserManagement } from './pages/UserManagement';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';

function ProtectedLayout() {
  const { currentUser, isLoading } = useSystem();

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-gray-600">Loading system...</div>;
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
  const { currentUser } = useSystem();

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={currentUser ? <Navigate to="/" replace /> : <Register />} />
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
    </BrowserRouter>
  );
}
