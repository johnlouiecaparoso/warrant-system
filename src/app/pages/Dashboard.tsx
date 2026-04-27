import { Suspense, lazy, useMemo } from 'react';
import { FileText, Clock, CheckCircle, XCircle, Ban } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { ChartCardFallback } from '../components/ChartCardFallback';

const DashboardCharts = lazy(() =>
  import('../components/DashboardCharts').then((module) => ({ default: module.DashboardCharts })),
);

export function Dashboard() {
  const { warrants, auditLogs, overdueCount } = useSystem();

  const totalWarrants = warrants.length;
  const pendingWarrants = warrants.filter((w) => w.status === 'Pending').length;
  const servedWarrants = warrants.filter((w) => w.status === 'Served').length;
  const unservedWarrants = warrants.filter((w) => w.status === 'Unserved').length;
  const cancelledWarrants = warrants.filter((w) => w.status === 'Cancelled').length;

  const monthlyData = useMemo(() => {
    const result: Array<{ id: string; month: string; warrants: number }> = [];
    const now = new Date();

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('en-US', { month: 'short' });
      const count = warrants.filter((w) => {
        const issued = new Date(w.dateIssued);
        const issuedKey = `${issued.getFullYear()}-${String(issued.getMonth() + 1).padStart(2, '0')}`;
        return issuedKey === key;
      }).length;

      result.push({ id: key, month: label, warrants: count });
    }

    return result;
  }, [warrants]);

  const pieData = [
    { id: 'pending', name: 'Pending', value: pendingWarrants, color: '#f97316' },
    { id: 'served', name: 'Served', value: servedWarrants, color: '#22c55e' },
    { id: 'unserved', name: 'Unserved', value: unservedWarrants, color: '#ef4444' },
    { id: 'cancelled', name: 'Cancelled', value: cancelledWarrants, color: '#6b7280' },
  ];
  const nonZeroPieData = pieData.filter((item) => item.value > 0);

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      case 'Served':
        return 'bg-green-100 text-green-700';
      case 'Unserved':
        return 'bg-red-100 text-red-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of warrant management statistics</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Warrants</CardTitle>
            <FileText className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWarrants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingWarrants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Served</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{servedWarrants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unserved</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unservedWarrants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cancelled</CardTitle>
            <Ban className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{cancelledWarrants}</div>
          </CardContent>
        </Card>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCardFallback title="Monthly Warrant Activity" />
            <ChartCardFallback title="Warrant Status Distribution" />
          </div>
        }
      >
        <DashboardCharts monthlyData={monthlyData} nonZeroPieData={nonZeroPieData} />
      </Suspense>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Warrant Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="hidden overflow-x-auto sm:block">
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
                          <Badge className={statusBadgeClass(warrant.status)}>{warrant.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 sm:hidden">
                {warrants.slice(0, 5).map((warrant) => (
                  <div key={warrant.id} className="rounded-lg border p-3">
                    <p className="font-medium text-gray-900">{warrant.name}</p>
                    <p className="text-sm text-gray-600">{warrant.caseNumber}</p>
                    <div className="mt-2">
                      <Badge className={statusBadgeClass(warrant.status)}>{warrant.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
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
                <div key={log.id} className="border-b py-2 last:border-0">
                  <p className="font-medium text-gray-900">{log.user}</p>
                  <p className="text-sm text-gray-600">{log.action}</p>
                  <p className="text-xs text-gray-500">{log.dateTime}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="text-orange-900">Urgent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Pending</p>
              <p className="mt-1 text-sm text-orange-900">{pendingWarrants} warrants pending assignment</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Unserved</p>
              <p className="mt-1 text-sm text-orange-900">{unservedWarrants} warrants remain unserved</p>
            </div>
            <div className="rounded-xl bg-white/70 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">Overdue</p>
              <p className="mt-1 text-sm text-orange-900">{overdueCount} warrants are overdue by more than 30 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
