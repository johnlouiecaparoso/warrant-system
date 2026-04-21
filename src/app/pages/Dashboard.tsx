import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export function Dashboard() {
  const { warrants, auditLogs, overdueCount } = useSystem();

  const totalWarrants = warrants.length;
  const pendingWarrants = warrants.filter(w => w.status === 'Pending').length;
  const servedWarrants = warrants.filter(w => w.status === 'Served').length;
  const unservedWarrants = warrants.filter(w => w.status === 'Unserved').length;
  const cancelledWarrants = warrants.filter(w => w.status === 'Cancelled').length;

  const monthlyData = [
    { id: 'jan', month: 'Jan', warrants: 12 },
    { id: 'feb', month: 'Feb', warrants: 19 },
    { id: 'mar', month: 'Mar', warrants: 15 },
    { id: 'apr', month: 'Apr', warrants: 25 }
  ];

  const pieData = [
    { id: 'pending', name: 'Pending', value: pendingWarrants, color: '#f97316' },
    { id: 'served', name: 'Served', value: servedWarrants, color: '#22c55e' },
    { id: 'unserved', name: 'Unserved', value: unservedWarrants, color: '#ef4444' },
    { id: 'cancelled', name: 'Cancelled', value: cancelledWarrants, color: '#6b7280' }
  ];

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'Served': return 'bg-green-100 text-green-700';
      case 'Unserved': return 'bg-red-100 text-red-700';
      case 'Cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of warrant management statistics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Warrants</CardTitle>
            <FileText className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWarrants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingWarrants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Served</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{servedWarrants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unserved</CardTitle>
            <XCircle className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unservedWarrants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cancelled</CardTitle>
            <Ban className="w-4 h-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{cancelledWarrants}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Warrant Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="warrants"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Warrants"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warrant Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Warrant Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Case Number</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warrants.slice(0, 5).map((warrant) => (
                    <TableRow key={warrant.id}>
                      <TableCell className="font-medium">{warrant.name}</TableCell>
                      <TableCell>{warrant.caseNumber}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(warrant.status)}>
                          {warrant.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="py-2 border-b last:border-0">
                  <p className="font-medium text-gray-900">{log.user}</p>
                  <p className="text-sm text-gray-600">{log.action}</p>
                  <p className="text-xs text-gray-500">{log.dateTime}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">Urgent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-orange-800">• {pendingWarrants} warrants pending assignment</p>
            <p className="text-sm text-orange-800">• {unservedWarrants} warrants remain unserved</p>
            <p className="text-sm text-orange-800">• {overdueCount} warrants are overdue (pending over 30 days)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
