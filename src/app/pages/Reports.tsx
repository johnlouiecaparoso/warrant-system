import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { FileText, Download, Printer, BarChart3 } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export function Reports() {
  const { warrants } = useSystem();
  const [reportType, setReportType] = useState('daily-served');
  const [startDate, setStartDate] = useState('2026-04-01');
  const [endDate, setEndDate] = useState('2026-04-21');

  const isWithinRange = (date: string) => {
    if (!date) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const target = new Date(date);
    return target >= start && target <= end;
  };

  const getFilteredWarrants = () => {
    const byRange = warrants.filter((w) => {
      if (reportType === 'daily-served' || reportType === 'monthly-served') {
        return isWithinRange(w.dateServed || w.dateIssued);
      }
      return isWithinRange(w.dateIssued);
    });

    switch (reportType) {
      case 'daily-served':
      case 'monthly-served':
        return byRange.filter(w => w.status === 'Served');
      case 'pending':
        return byRange.filter(w => w.status === 'Pending');
      case 'unserved':
        return byRange.filter(w => w.status === 'Unserved');
      case 'cancelled':
        return byRange.filter(w => w.status === 'Cancelled');
      default:
        return byRange;
    }
  };

  const filteredWarrants = getFilteredWarrants();

  const chartData = [
    { id: 'pending', status: 'Pending', count: filteredWarrants.filter(w => w.status === 'Pending').length },
    { id: 'served', status: 'Served', count: filteredWarrants.filter(w => w.status === 'Served').length },
    { id: 'unserved', status: 'Unserved', count: filteredWarrants.filter(w => w.status === 'Unserved').length },
    { id: 'cancelled', status: 'Cancelled', count: filteredWarrants.filter(w => w.status === 'Cancelled').length },
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

  const handleExportPDF = () => {
    const html = `
      <html>
        <head>
          <title>${reportTitles[reportType as keyof typeof reportTitles]}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; text-align: left; }
            h1 { margin: 0; font-size: 20px; }
            p { margin: 4px 0; color: #555; }
          </style>
        </head>
        <body>
          <h1>${reportTitles[reportType as keyof typeof reportTitles]}</h1>
          <p>Period: ${startDate} to ${endDate}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Case Number</th><th>Offense</th><th>Status</th><th>Date Issued</th><th>Officer</th>
              </tr>
            </thead>
            <tbody>
              ${filteredWarrants
                .map(
                  (w) =>
                    `<tr><td>${w.name}</td><td>${w.caseNumber}</td><td>${w.offense}</td><td>${w.status}</td><td>${w.dateIssued}</td><td>${w.assignedOfficer}</td></tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (!win) {
      toast.error('Please allow popups to export PDF.');
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    toast.success('Print dialog opened. Choose Save as PDF.');
  };

  const handleExportExcel = () => {
    const headers = ['Name', 'Case Number', 'Offense', 'Status', 'Date Issued', 'Assigned Officer'];
    const rows = filteredWarrants.map((w) => [
      w.name,
      w.caseNumber,
      w.offense,
      w.status,
      w.dateIssued,
      w.assignedOfficer,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${reportType}-${startDate}-to-${endDate}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success('Excel-compatible CSV exported successfully.');
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTitles = {
    'daily-served': 'Daily Served Warrants Report',
    'monthly-served': 'Monthly Served Warrants Report',
    'pending': 'Pending Warrants Report',
    'unserved': 'Unserved Warrants Report',
    'cancelled': 'Cancelled Warrants Report',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and export warrant reports</p>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily-served">Daily Served Warrants</SelectItem>
                  <SelectItem value="monthly-served">Monthly Served Warrants</SelectItem>
                  <SelectItem value="pending">Pending Warrants</SelectItem>
                  <SelectItem value="unserved">Unserved Warrants</SelectItem>
                  <SelectItem value="cancelled">Cancelled Warrants</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button onClick={handlePrint} variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Report Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{reportTitles[reportType as keyof typeof reportTitles]}</CardTitle>
            <Badge variant="outline">{filteredWarrants.length} Records</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Period: {startDate} to {endDate}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Offense</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Assigned Officer</TableHead>
                  {reportType.includes('served') && <TableHead>Date Served</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarrants.map((warrant) => (
                  <TableRow key={warrant.id}>
                    <TableCell className="font-medium">{warrant.name}</TableCell>
                    <TableCell>{warrant.caseNumber}</TableCell>
                    <TableCell>{warrant.offense}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(warrant.status)}>
                        {warrant.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{warrant.dateIssued}</TableCell>
                    <TableCell>{warrant.assignedOfficer}</TableCell>
                    {reportType.includes('served') && (
                      <TableCell>{warrant.dateServed || 'N/A'}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredWarrants.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No records found for the selected criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Footer */}
      <div className="hidden print:block text-center text-sm text-gray-600 mt-8">
        <p>Philippine National Police - Butuan City Police Station 1</p>
        <p>Warrant Management System - Generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
