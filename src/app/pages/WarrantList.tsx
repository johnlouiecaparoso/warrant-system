import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { Edit, Eye, RefreshCw, Search, Trash2, UserPlus } from 'lucide-react';
import { Warrant } from '../data/mockData';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { useSystem } from '../context/SystemContext';

export function WarrantList() {
  const {
    warrants,
    users,
    updateWarrant,
    deleteWarrant: deleteWarrantAction,
    assignWarrant: assignWarrantAction,
    updateWarrantStatus,
  } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [offenseFilter, setOffenseFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [viewWarrant, setViewWarrant] = useState<Warrant | null>(null);
  const [editWarrant, setEditWarrant] = useState<Warrant | null>(null);
  const [assignDialogWarrant, setAssignDialogWarrant] = useState<Warrant | null>(null);
  const [updateStatusWarrant, setUpdateStatusWarrant] = useState<Warrant | null>(null);
  const [deleteDialogWarrant, setDeleteDialogWarrant] = useState<Warrant | null>(null);

  const [editForm, setEditForm] = useState<Partial<Warrant>>({});
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [dateAssigned, setDateAssigned] = useState(new Date().toISOString().slice(0, 10));
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [dateServed, setDateServed] = useState('');
  const [placeServed, setPlaceServed] = useState('');
  const [servedRemarks, setServedRemarks] = useState('');
  const [reasonUnserved, setReasonUnserved] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const officers = users.filter(u => u.role === 'Warrant Officer' && u.status === 'Active');
  const barangays = Array.from(new Set(warrants.map((w) => w.barangay))).sort();
  const offenses = Array.from(new Set(warrants.map((w) => w.offense))).sort();

  const filteredWarrants = warrants.filter(warrant => {
    const matchesSearch = warrant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warrant.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warrant.offense.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || warrant.status === statusFilter;
    const matchesBarangay = barangayFilter === 'all' || warrant.barangay === barangayFilter;
    const matchesOffense = offenseFilter === 'all' || warrant.offense === offenseFilter;
    const matchesFrom = !fromDate || warrant.dateIssued >= fromDate;
    const matchesTo = !toDate || warrant.dateIssued <= toDate;

    return matchesSearch && matchesStatus && matchesBarangay && matchesOffense && matchesFrom && matchesTo;
  });

  const totalPages = Math.ceil(filteredWarrants.length / itemsPerPage);
  const paginatedWarrants = filteredWarrants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = useMemo<ColumnDef<Warrant>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'caseNumber',
      header: 'Case Number',
    },
    {
      accessorKey: 'offense',
      header: 'Offense',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge className={statusBadgeClass(row.original.status)}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: 'assignedOfficer',
      header: 'Assigned Officer',
      cell: ({ row }) => row.original.assignedOfficer || 'Not assigned',
    },
    {
      accessorKey: 'dateIssued',
      header: 'Date Issued',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const warrant = row.original;
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => openEditDialog(warrant)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setViewWarrant(warrant)}>
              <Eye className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => openAssignDialog(warrant)}>
              <UserPlus className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setUpdateStatusWarrant(warrant)}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDeleteDialogWarrant(warrant)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ], [paginatedWarrants]);

  const table = useReactTable({
    data: paginatedWarrants,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-700';
      case 'Served': return 'bg-green-100 text-green-700';
      case 'Unserved': return 'bg-red-100 text-red-700';
      case 'Cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAssign = () => {
    if (!assignDialogWarrant || !selectedOfficer || !dateAssigned) return;
    assignWarrantAction({
      warrantId: assignDialogWarrant.id,
      officerName: selectedOfficer,
      dateAssigned,
      notes: assignmentNotes,
    });
    toast.success(`Warrant assigned to ${selectedOfficer}`);
    setAssignDialogWarrant(null);
    setSelectedOfficer('');
    setDateAssigned(new Date().toISOString().slice(0, 10));
    setAssignmentNotes('');
  };

  const handleStatusUpdate = () => {
    if (!updateStatusWarrant || !newStatus) return;

    updateWarrantStatus({
      warrantId: updateStatusWarrant.id,
      status: newStatus as Warrant['status'],
      served:
        newStatus === 'Served'
          ? {
              dateServed,
              placeServed,
              remarks: servedRemarks,
            }
          : undefined,
      unserved:
        newStatus === 'Unserved'
          ? {
              reasonUnserved,
              nextAction,
            }
          : undefined,
    });

    toast.success(`Warrant status updated to ${newStatus}`);
    setUpdateStatusWarrant(null);
    setNewStatus('');
    setDateServed('');
    setPlaceServed('');
    setServedRemarks('');
    setReasonUnserved('');
    setNextAction('');
  };

  const handleDelete = () => {
    if (!deleteDialogWarrant) return;
    deleteWarrantAction(deleteDialogWarrant.id);
    toast.success('Warrant deleted successfully');
    setDeleteDialogWarrant(null);
  };

  const handleEdit = () => {
    if (!editWarrant) return;
    updateWarrant(editWarrant.id, editForm);
    toast.success('Warrant details updated');
    setEditWarrant(null);
    setEditForm({});
  };

  const openEditDialog = (warrant: Warrant) => {
    setEditWarrant(warrant);
    setEditForm({ ...warrant });
  };

  const openAssignDialog = (warrant: Warrant) => {
    setAssignDialogWarrant(warrant);
    setSelectedOfficer(warrant.assignedOfficer || '');
    setDateAssigned(warrant.dateAssigned || new Date().toISOString().slice(0, 10));
    setAssignmentNotes(warrant.assignmentNotes || '');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warrant Records</h1>
        <p className="text-gray-600">View and manage all warrant records</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, case number, or offense..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Served">Served</SelectItem>
                <SelectItem value="Unserved">Unserved</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={barangayFilter} onValueChange={setBarangayFilter}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Filter by barangay" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barangays</SelectItem>
                {barangays.map((barangay) => (
                  <SelectItem key={barangay} value={barangay}>{barangay}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={offenseFilter} onValueChange={setOffenseFilter}>
              <SelectTrigger className="w-full md:w-52">
                <SelectValue placeholder="Filter by offense" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Offenses</SelectItem>
                {offenses.map((offense) => (
                  <SelectItem key={offense} value={offense}>{offense}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex flex-col md:flex-row gap-4">
            <div>
              <Label htmlFor="fromDate" className="text-xs text-gray-500">Date From</Label>
              <Input id="fromDate" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1 w-full md:w-48" />
            </div>
            <div>
              <Label htmlFor="toDate" className="text-xs text-gray-500">Date To</Label>
              <Input id="toDate" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1 w-full md:w-48" />
            </div>
            <div className="md:self-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setBarangayFilter('all');
                  setOffenseFilter('all');
                  setFromDate('');
                  setToDate('');
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {paginatedWarrants.map((warrant) => (
              <Card key={warrant.id}>
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{warrant.name}</p>
                      <p className="text-sm text-gray-600">{warrant.caseNumber}</p>
                    </div>
                    <Badge className={statusBadgeClass(warrant.status)}>{warrant.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Offense: {warrant.offense}</p>
                  <p className="text-sm text-gray-600">Officer: {warrant.assignedOfficer || 'Not assigned'}</p>
                  <p className="text-sm text-gray-600">Issued: {warrant.dateIssued}</p>
                  <div className="pt-1 grid grid-cols-5 gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditDialog(warrant)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setViewWarrant(warrant)}><Eye className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => openAssignDialog(warrant)}><UserPlus className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setUpdateStatusWarrant(warrant)}><RefreshCw className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteDialogWarrant(warrant)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {paginatedWarrants.length === 0 && (
            <div className="text-center py-12 text-gray-500">No warrant records found for the selected criteria.</div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredWarrants.length)} of {filteredWarrants.length} warrants
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editWarrant} onOpenChange={() => setEditWarrant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Warrant</DialogTitle>
            <DialogDescription>Update warrant information and save changes.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={editForm.name || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Alias</Label>
              <Input value={editForm.alias || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, alias: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Case Number</Label>
              <Input value={editForm.caseNumber || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, caseNumber: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Offense</Label>
              <Input value={editForm.offense || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, offense: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Date Issued</Label>
              <Input type="date" value={editForm.dateIssued || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, dateIssued: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Barangay</Label>
              <Input value={editForm.barangay || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, barangay: e.target.value }))} className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Remarks</Label>
              <Textarea value={editForm.remarks || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, remarks: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWarrant(null)}>Cancel</Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewWarrant} onOpenChange={() => setViewWarrant(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Warrant Details</DialogTitle>
          </DialogHeader>
          {viewWarrant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{viewWarrant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alias</p>
                  <p className="font-medium">{viewWarrant.alias}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Case Number</p>
                  <p className="font-medium">{viewWarrant.caseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Offense</p>
                  <p className="font-medium">{viewWarrant.offense}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Court</p>
                  <p className="font-medium">{viewWarrant.court}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Judge</p>
                  <p className="font-medium">{viewWarrant.judge}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Issued</p>
                  <p className="font-medium">{viewWarrant.dateIssued}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={statusBadgeClass(viewWarrant.status)}>
                    {viewWarrant.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Barangay</p>
                  <p className="font-medium">{viewWarrant.barangay}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned Officer</p>
                  <p className="font-medium">{viewWarrant.assignedOfficer}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{viewWarrant.address}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Remarks</p>
                  <p className="font-medium">{viewWarrant.remarks}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewWarrant(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignDialogWarrant} onOpenChange={() => setAssignDialogWarrant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Warrant to Officer</DialogTitle>
            <DialogDescription>
              Assign {assignDialogWarrant?.name} ({assignDialogWarrant?.caseNumber}) to an officer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Warrant Name</Label>
              <Input value={assignDialogWarrant?.name || ''} disabled className="mt-1" />
            </div>
            <div>
              <Label>Case Number</Label>
              <Input value={assignDialogWarrant?.caseNumber || ''} disabled className="mt-1" />
            </div>
            <div>
              <Label>Select Officer</Label>
              <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose officer" />
                </SelectTrigger>
                <SelectContent>
                  {officers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.fullName}>
                      {officer.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Date Assigned</Label>
              <Input type="date" value={dateAssigned} onChange={(e) => setDateAssigned(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={assignmentNotes} onChange={(e) => setAssignmentNotes(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogWarrant(null)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={!selectedOfficer || !dateAssigned}>Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!updateStatusWarrant} onOpenChange={() => setUpdateStatusWarrant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Warrant Status</DialogTitle>
            <DialogDescription>
              Update status for {updateStatusWarrant?.name} ({updateStatusWarrant?.caseNumber})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Served">Served</SelectItem>
                  <SelectItem value="Unserved">Unserved</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'Served' && (
              <>
                <div>
                  <Label>Date Served</Label>
                  <Input type="date" value={dateServed} onChange={(e) => setDateServed(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Place Served</Label>
                  <Input value={placeServed} onChange={(e) => setPlaceServed(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Textarea value={servedRemarks} onChange={(e) => setServedRemarks(e.target.value)} className="mt-1" />
                </div>
              </>
            )}
            {newStatus === 'Unserved' && (
              <>
                <div>
                  <Label>Reason for Unserved</Label>
                  <Textarea value={reasonUnserved} onChange={(e) => setReasonUnserved(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>Next Action</Label>
                  <Input value={nextAction} onChange={(e) => setNextAction(e.target.value)} className="mt-1" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateStatusWarrant(null)}>Cancel</Button>
            <Button onClick={handleStatusUpdate} disabled={!newStatus}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteDialogWarrant} onOpenChange={() => setDeleteDialogWarrant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the warrant for {deleteDialogWarrant?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogWarrant(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
