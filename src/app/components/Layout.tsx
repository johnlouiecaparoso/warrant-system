import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Users,
  Settings,
  ScrollText,
  Search as SearchIcon,
  Bell,
  User,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { useSystem } from '../context/SystemContext';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, urgentCount } = useSystem();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(globalSearch.trim())}`);
    setSidebarOpen(false);
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: FileText, label: 'Warrant Encoding', path: '/warrants/encode' },
    { icon: FileText, label: 'Warrant Records', path: '/warrants' },
    { icon: SearchIcon, label: 'Search', path: '/search' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Users, label: 'User Management', path: '/users' },
    { icon: ScrollText, label: 'Audit Logs', path: '/audit-logs' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];

  const pageTitleMap: Record<string, string> = {
    '/': 'Dashboard',
    '/warrants/encode': 'Warrant Encoding',
    '/warrants': 'Warrant Records',
    '/search': 'Search',
    '/reports': 'Reports',
    '/users': 'User Management',
    '/audit-logs': 'Audit Logs',
    '/settings': 'Settings',
  };

  const currentPageLabel = pageTitleMap[location.pathname] || 'Dashboard';

  const visibleNavItems = navItems.filter((item) => {
    if (item.path !== '/users') return true;
    return currentUser?.role === 'Admin' || currentUser?.role === 'Station Commander';
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <button
              aria-label="Toggle navigation menu"
              title="Toggle navigation menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">PNP</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900">Butuan City PS1</h1>
                <p className="text-xs text-gray-500">Warrant Management System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={handleGlobalSearch} className="hidden md:block">
              <div className="relative w-72">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Global search warrants..."
                  className="pl-9 bg-gray-50"
                />
              </div>
            </form>
            <button aria-label="Notifications" title="Notifications" className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 text-[11px] px-1 grid place-items-center rounded-full bg-red-500 text-white">
                  {urgentCount > 99 ? '99+' : urgentCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{currentUser?.fullName}</p>
                <p className="text-xs text-gray-500">{currentUser?.role}</p>
              </div>
            </div>
            <button
              aria-label="Logout"
              title="Logout"
              onClick={() => setLogoutDialogOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-red-600"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200
          transition-transform duration-300 z-40 w-64
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="p-4 space-y-2">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="lg:ml-64 mt-16 p-6">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <Outlet />
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will need to login again to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
