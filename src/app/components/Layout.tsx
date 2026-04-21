import { useMemo, useState } from 'react';
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
  LogOut,
  CheckCircle2,
  Clock3,
  UserCog,
  ShieldAlert,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { useSystem } from '../context/SystemContext';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const {
    currentUser,
    logout,
    urgentCount,
    warrants,
    updateCurrentProfile,
    overdueCount,
    settings,
  } = useSystem();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(globalSearch.trim())}`);
    setSidebarOpen(false);
  };

  const notifications = useMemo(() => {
    const pendingWarrants = warrants.filter((w) => w.status === 'Pending').length;
    const unservedWarrants = warrants.filter((w) => w.status === 'Unserved').length;
    const approvalQueue =
      currentUser?.role === 'Admin'
        ? warrants.filter((w) => w.approvalStatus === 'For Approval').length
        : 0;

    const list: Array<{ id: string; title: string; description: string; icon: JSX.Element; route: string }> = [];

    if (settings.notifyPending && pendingWarrants > 0) {
      list.push({
        id: 'pending-warrants',
        title: 'Pending Warrants',
        description: `${pendingWarrants} warrant(s) waiting for action.`,
        icon: <Clock3 className="w-4 h-4 text-orange-600" />,
        route: '/warrants',
      });
    }

    if (settings.notifyPending && approvalQueue > 0) {
      list.push({
        id: 'approval-queue',
        title: 'Awaiting Approval',
        description: `${approvalQueue} warrant submission(s) waiting for admin approval.`,
        icon: <ShieldAlert className="w-4 h-4 text-blue-600" />,
        route: '/warrants',
      });
    }

    if (unservedWarrants > 0) {
      list.push({
        id: 'unserved-warrants',
        title: 'Unserved Warrants',
        description: `${unservedWarrants} warrant(s) marked unserved.`,
        icon: <ShieldAlert className="w-4 h-4 text-red-600" />,
        route: '/warrants',
      });
    }

    if (settings.notifyOverdue && overdueCount > 0) {
      list.push({
        id: 'overdue-warrants',
        title: 'Overdue Warrants',
        description: `${overdueCount} pending warrant(s) older than 30 days.`,
        icon: <ShieldAlert className="w-4 h-4 text-amber-700" />,
        route: '/warrants',
      });
    }

    if (list.length === 0) {
      list.push({
        id: 'all-clear',
        title: 'All Caught Up',
        description: 'No urgent notifications right now.',
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        route: '/',
      });
    }

    return list;
  }, [currentUser?.role, overdueCount, settings.notifyOverdue, settings.notifyPending, warrants]);

  const openProfileDialog = () => {
    setFullName(currentUser?.fullName || '');
    setNewPassword('');
    setProfileDialogOpen(true);
  };

  const handleProfileSave = async () => {
    const result = await updateCurrentProfile({ fullName, password: newPassword });
    if (!result.ok) {
      toast.error(result.message || 'Unable to update profile.');
      return;
    }
    toast.success(result.message || 'Profile updated successfully.');
    setProfileDialogOpen(false);
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
    if (item.path === '/warrants/encode') return currentUser?.role === 'Warrant Officer';
    if (item.path === '/users' || item.path === '/audit-logs') {
      return currentUser?.role === 'Admin';
    }
    return true;
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
              <img
                src="/img/logo.jpg?v=2"
                alt="Warrant system logo"
                className="h-10 w-10 rounded-lg object-cover shadow-sm"
              />
              <div>
                <h1 className="font-bold text-gray-900">{settings.officeName}</h1>
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
            <Popover>
              <PopoverTrigger asChild>
                <button aria-label="Notifications" title="Notifications" className="relative p-2 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {urgentCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 text-[11px] px-1 grid place-items-center rounded-full bg-red-500 text-white">
                      {urgentCount > 99 ? '99+' : urgentCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="px-4 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">Live operational alerts</p>
                </div>
                <div className="max-h-80 overflow-auto">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.route)}
                      className="w-full text-left px-4 py-3 border-b last:border-b-0 flex items-start gap-3 hover:bg-gray-50"
                    >
                      <div className="mt-0.5">{item.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        <p className="text-xs text-gray-600">{item.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="p-2 border-t">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/')}>View Dashboard</Button>
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">{currentUser?.fullName}</p>
                    <p className="text-xs text-gray-500">{currentUser?.role}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium text-sm">{currentUser?.fullName}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openProfileDialog}>
                  <UserCog className="w-4 h-4 mr-2" />
                  Edit Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your name or password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="profileFullName">Full Name</Label>
              <Input id="profileFullName" className="mt-1" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="profilePassword">New Password</Label>
              <Input id="profilePassword" type="password" className="mt-1" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Leave blank to keep current password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleProfileSave}>Save Profile</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
