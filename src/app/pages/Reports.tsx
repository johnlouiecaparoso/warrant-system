import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
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
import { FileText, Download } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { toast } from 'sonner';
import { ChartCardFallback } from '../components/ChartCardFallback';
import { getDisplayStatus, isDisplayPending } from '../lib/warrantStatus';

const ReportsChart = lazy(() =>
  import('../components/ReportsChart').then((module) => ({ default: module.ReportsChart })),
);

const reportTitles = {
  'daily-served': 'Daily Served Warrants Report',
  'monthly-served': 'Monthly Served Warrants Report',
  approved: 'Approved Warrants Report',
  pending: 'Pending Warrants Report',
  unserved: 'Unserved Warrants Report',
  cancelled: 'Cancelled Warrants Report',
} as const;

type ReportType = keyof typeof reportTitles;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Reports() {
  const { warrants, settings } = useSystem();
  const today = new Date();
  const allRelevantDates = useMemo(
    () =>
      warrants
        .flatMap((warrant) => [warrant.dateIssued, warrant.dateServed, warrant.approvedAt, warrant.submittedAt])
        .filter((value): value is string => Boolean(value))
        .map((value) => new Date(value))
        .filter((value) => !Number.isNaN(value.getTime()))
        .sort((a, b) => a.getTime() - b.getTime()),
    [warrants],
  );
  const defaultStartDate = (allRelevantDates[0] ?? today).toISOString().slice(0, 10);
  const [reportType, setReportType] = useState<ReportType>('daily-served');
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));
  const [hasInitializedRange, setHasInitializedRange] = useState(false);

  useEffect(() => {
    if (!hasInitializedRange && warrants.length > 0) {
      setStartDate(defaultStartDate);
      setHasInitializedRange(true);
    }
  }, [defaultStartDate, hasInitializedRange, warrants.length]);

  const hasInvalidDateRange = startDate > endDate;

  const isWithinRange = (date: string) => {
    if (!date || hasInvalidDateRange) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const target = new Date(date);
    return target >= start && target <= end;
  };

  const warrantsInRange = useMemo(() => {
    return warrants.filter((w) => {
      if (reportType === 'daily-served' || reportType === 'monthly-served') {
        return isWithinRange(w.dateServed || w.dateIssued);
      }
      if (reportType === 'approved') {
        return isWithinRange(w.approvedAt || w.submittedAt || w.dateIssued);
      }
      return isWithinRange(w.dateIssued);
    });
  }, [hasInvalidDateRange, reportType, warrants, startDate, endDate]);

  const filteredWarrants = useMemo(() => {
    const byRange = warrantsInRange;

      switch (reportType) {
      case 'daily-served':
      case 'monthly-served':
        return byRange.filter((w) => w.status === 'Served');
      case 'approved':
        return byRange.filter((w) => getDisplayStatus(w) === 'Approved');
      case 'pending':
        return byRange.filter((w) => isDisplayPending(w));
      case 'unserved':
        return byRange.filter((w) => w.status === 'Unserved');
      case 'cancelled':
        return byRange.filter((w) => w.status === 'Cancelled');
      default:
        return byRange;
    }
  }, [reportType, warrantsInRange]);

  const chartData = [
    { id: 'pending', status: 'Pending', count: warrantsInRange.filter((w) => isDisplayPending(w)).length },
    { id: 'approved', status: 'Approved', count: warrantsInRange.filter((w) => getDisplayStatus(w) === 'Approved').length },
    { id: 'served', status: 'Served', count: warrantsInRange.filter((w) => w.status === 'Served').length },
    { id: 'unserved', status: 'Unserved', count: warrantsInRange.filter((w) => w.status === 'Unserved').length },
    { id: 'cancelled', status: 'Cancelled', count: warrantsInRange.filter((w) => w.status === 'Cancelled').length },
  ];

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-orange-100 text-orange-700';
      case 'Approved':
        return 'bg-emerald-100 text-emerald-700';
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

  const handleExportPDF = () => {
    if (hasInvalidDateRange) {
      toast.error('Start date must be earlier than or equal to end date.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>${reportTitles[reportType]}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; font-size: 12px; text-align: left; }
            h1 { margin: 0; font-size: 20px; }
            p { margin: 4px 0; color: #555; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(reportTitles[reportType])}</h1>
          <p>${escapeHtml(settings.officeName)}</p>
          <p>Period: ${escapeHtml(startDate)} to ${escapeHtml(endDate)}</p>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Case Number</th>
                <th>Offense</th>
                <th>Status</th>
                <th>Date Issued</th>
                <th>Assigned Officer</th>
              </tr>
            </thead>
            <tbody>
              ${
                filteredWarrants
                  .map(
                    (w) =>
                      `<tr>
                        <td>${escapeHtml(w.name)}</td>
                        <td>${escapeHtml(w.caseNumber)}</td>
                        <td>${escapeHtml(w.offense)}</td>
                        <td>${escapeHtml(getDisplayStatus(w))}</td>
                        <td>${escapeHtml(w.dateIssued)}</td>
                        <td>${escapeHtml(w.assignedOfficer || 'Not assigned')}</td>
                      </tr>`,
                  )
                  .join('') || '<tr><td colspan="6">No records found for the selected criteria.</td></tr>'
              }
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
    toast.success('PDF export opened. Choose Save as PDF in the print dialog.');
  };

  const handleExportExcel = () => {
    if (hasInvalidDateRange) {
      toast.error('Start date must be earlier than or equal to end date.');
      return;
    }

    const tableRows = filteredWarrants
      .map(
        (w) => `
          <tr>
            <td>${escapeHtml(w.name)}</td>
            <td>${escapeHtml(w.caseNumber)}</td>
            <td>${escapeHtml(w.offense)}</td>
            <td>${escapeHtml(getDisplayStatus(w))}</td>
            <td>${escapeHtml(w.dateIssued)}</td>
            <td>${escapeHtml(w.assignedOfficer || 'Not assigned')}</td>
            ${reportType.includes('served') ? `<td>${escapeHtml(w.dateServed || 'N/A')}</td>` : ''}
          </tr>`,
      )
      .join('');

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office"
            xmlns:x="urn:schemas-microsoft-com:office:excel"
            xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(reportTitles[reportType])}</title>
        </head>
        <body>
          <table border="1">
            <tr><th colspan="${reportType.includes('served') ? 7 : 6}">${escapeHtml(reportTitles[reportType])}</th></tr>
            <tr><td colspan="${reportType.includes('served') ? 7 : 6}">${escapeHtml(settings.officeName)}</td></tr>
            <tr><td colspan="${reportType.includes('served') ? 7 : 6}">Period: ${escapeHtml(startDate)} to ${escapeHtml(endDate)}</td></tr>
            <tr>
              <th>Name</th>
              <th>Case Number</th>
              <th>Offense</th>
              <th>Status</th>
              <th>Date Issued</th>
              <th>Assigned Officer</th>
              ${reportType.includes('served') ? '<th>Date Served</th>' : ''}
            </tr>
            ${tableRows || `<tr><td colspan="${reportType.includes('served') ? 7 : 6}">No records found for the selected criteria.</td></tr>`}
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    downloadBlob(blob, `${reportType}-${startDate}-to-${endDate}.xls`);
    toast.success('Excel report exported successfully.');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Generate and export warrant reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily-served">Daily Served Warrants</SelectItem>
                  <SelectItem value="monthly-served">Monthly Served Warrants</SelectItem>
                  <SelectItem value="approved">Approved Warrants</SelectItem>
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

          {hasInvalidDateRange && (
            <p className="mt-3 text-sm text-red-600">Start date must be earlier than or equal to end date.</p>
          )}

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={handleExportPDF} className="bg-blue-600 hover:bg-blue-700" disabled={hasInvalidDateRange}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button onClick={handleExportExcel} variant="outline" disabled={hasInvalidDateRange}>
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={<ChartCardFallback title="Report Summary" height={300} />}>
        <ReportsChart chartData={chartData} />
      </Suspense>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>{reportTitles[reportType]}</CardTitle>
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
                      <Badge className={statusBadgeClass(getDisplayStatus(warrant))}>
                        {getDisplayStatus(warrant)}
                      </Badge>
                    </TableCell>
                    <TableCell>{warrant.dateIssued}</TableCell>
                    <TableCell>{warrant.assignedOfficer || 'Not assigned'}</TableCell>
                    {reportType.includes('served') && (
                      <TableCell>{warrant.dateServed || 'N/A'}</TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredWarrants.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">No records found for the selected criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
