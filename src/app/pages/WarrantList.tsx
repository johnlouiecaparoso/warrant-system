import { useEffect, useMemo, useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { CheckCircle2, Edit, Eye, LoaderCircle, Search, Trash2 } from 'lucide-react';
import { Warrant } from '../data/models';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { useSystem } from '../context/SystemContext';
import { getDisplayStatus } from '../lib/warrantStatus';

export function WarrantList() {
  const {
    warrants,
    updateWarrant,
    deleteWarrant: deleteWarrantAction,
    approveWarrant,
    currentUser,
    backendMessage,
    isBackendReady,
  } = useSystem();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [barangayFilter, setBarangayFilter] = useState('all');
  const [offenseFilter, setOffenseFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedWarrantId, setSelectedWarrantId] = useState<string | null>(null);
  const [editingWarrantId, setEditingWarrantId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Warrant>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const itemsPerPage = 8;
  const isAdmin = currentUser?.role === 'Admin';

  const selectedWarrant = useMemo(
    () => warrants.find((warrant) => warrant.id === selectedWarrantId) ?? null,
    [selectedWarrantId, warrants],
  );
  const editingWarrant = useMemo(
    () => warrants.find((warrant) => warrant.id === editingWarrantId) ?? null,
    [editingWarrantId, warrants],
  );

  const actionKey = (action: string, warrantId: string) => `${action}:${warrantId}`;
  const isActionBusy = (action: string, warrantId: string) => activeAction === actionKey(action, warrantId);
  const canOfficerModify = (warrant: Warrant) =>
    currentUser?.role === 'Warrant Officer' &&
    (
      warrant.submittedById === currentUser.id ||
      (warrant.submittedBy || '').trim().toLowerCase() === (currentUser.fullName || '').trim().toLowerCase()
    );
  const barangays = Array.from(new Set(warrants.map((w) => w.barangay))).sort();
  const offenses = Array.from(new Set(warrants.map((w) => w.offense))).sort();

  const filteredWarrants = warrants.filter((warrant) => {
    const matchesSearch =
      warrant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warrant.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warrant.offense.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || getDisplayStatus(warrant) === statusFilter;
    const matchesBarangay = barangayFilter === 'all' || warrant.barangay === barangayFilter;
    const matchesOffense = offenseFilter === 'all' || warrant.offense === offenseFilter;
    const matchesFrom = !fromDate || warrant.dateIssued >= fromDate;
    const matchesTo = !toDate || warrant.dateIssued <= toDate;

    return matchesSearch && matchesStatus && matchesBarangay && matchesOffense && matchesFrom && matchesTo;
  });

  const totalPages = Math.ceil(filteredWarrants.length / itemsPerPage);
  const paginatedWarrants = filteredWarrants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

  const openViewPanel = (warrantId: string) => {
    setSelectedWarrantId(warrantId);
    setEditingWarrantId(null);
    setEditForm({});
  };

  const openEditPanel = (warrant: Warrant) => {
    if (!canOfficerModify(warrant)) {
      toast.error('You can only edit warrants you submitted.');
      return;
    }
    setSelectedWarrantId(warrant.id);
    setEditingWarrantId(warrant.id);
    setEditForm({ ...warrant });
  };

  const closePanels = () => {
    setSelectedWarrantId(null);
    setEditingWarrantId(null);
    setEditForm({});
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, barangayFilter, offenseFilter, fromDate, toDate]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleApprove = async (warrantId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can approve warrant submissions.');
      return;
    }

    setActiveAction(actionKey('approve', warrantId));
    try {
      const result = await approveWarrant(warrantId);
      if (!result.ok) {
        toast.error(result.message || 'Unable to approve warrant.');
        return;
      }
      toast.success(result.message || 'Warrant approved successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve warrant.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleEdit = async () => {
    if (!editingWarrant || !canOfficerModify(editingWarrant)) {
      toast.error('You can only edit warrants you submitted.');
      return;
    }

    setActiveAction(actionKey('edit', editingWarrant.id));
    try {
      const result = await updateWarrant(editingWarrant.id, editForm);
      if (!result.ok) {
        toast.error(result.message || 'Unable to update warrant.');
        return;
      }
      toast.success(result.message || 'Warrant details updated.');
      setEditingWarrantId(null);
      setEditForm({});
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update warrant.');
    } finally {
      setActiveAction(null);
    }
  };

  const handleDelete = async (warrant: Warrant) => {
    if (!canOfficerModify(warrant)) {
      toast.error('You can only delete warrants you submitted.');
      return;
    }

    if (!window.confirm(`Delete the warrant for ${warrant.name}? This cannot be undone.`)) {
      return;
    }

    setActiveAction(actionKey('delete', warrant.id));
    try {
      const result = await deleteWarrantAction(warrant.id);
      if (!result.ok) {
        toast.error(result.message || 'Unable to delete warrant.');
        return;
      }
      toast.success(result.message || 'Warrant deleted successfully.');
      closePanels();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete warrant.');
    } finally {
      setActiveAction(null);
    }
  };

  const renderActions = (warrant: Warrant) => {
    const canModifyWarrant = canOfficerModify(warrant);

    return (
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => openViewPanel(warrant.id)}>
          <Eye className="w-4 h-4" />
        </Button>
        {canModifyWarrant && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => openEditPanel(warrant)}
            disabled={!isBackendReady || activeAction !== null}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
        {isAdmin && warrant.approvalStatus !== 'Approved' && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleApprove(warrant.id)}
            disabled={!isBackendReady || activeAction !== null}
          >
            {isActionBusy('approve', warrant.id) ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </Button>
        )}
        {canModifyWarrant && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => handleDelete(warrant)}
            disabled={!isBackendReady || activeAction !== null}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Warrant Records</h1>
        <p className="text-gray-600">
          {isAdmin
            ? 'Review submitted warrants and approve them.'
            : 'View, edit, and delete the warrants you submitted.'}
        </p>
      </div>

      {backendMessage && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {backendMessage}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
                <SelectItem value="Approved">Approved</SelectItem>
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
          <div className="mt-4 flex flex-col gap-4 md:flex-row">
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
                  setSearchTerm('');
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

      <Card>
        <CardContent className="pt-6">
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Case Number</TableHead>
                  <TableHead>Offense</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Officer</TableHead>
                  <TableHead>Date Issued</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedWarrants.map((warrant) => (
                  <TableRow key={warrant.id}>
                    <TableCell><span className="font-medium">{warrant.name}</span></TableCell>
                    <TableCell>{warrant.caseNumber}</TableCell>
                    <TableCell>{warrant.offense}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(getDisplayStatus(warrant))}>{getDisplayStatus(warrant)}</Badge>
                    </TableCell>
                    <TableCell>{warrant.assignedOfficer || 'Not assigned'}</TableCell>
                    <TableCell>{warrant.dateIssued}</TableCell>
                    <TableCell>{renderActions(warrant)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {paginatedWarrants.map((warrant) => (
              <Card key={warrant.id}>
                <CardContent className="space-y-2 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{warrant.name}</p>
                      <p className="text-sm text-gray-600">{warrant.caseNumber}</p>
                    </div>
                    <Badge className={statusBadgeClass(getDisplayStatus(warrant))}>{getDisplayStatus(warrant)}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">Offense: {warrant.offense}</p>
                  <p className="text-sm text-gray-600">Officer: {warrant.assignedOfficer || 'Not assigned'}</p>
                  <p className="text-sm text-gray-600">Issued: {warrant.dateIssued}</p>
                  {renderActions(warrant)}
                </CardContent>
              </Card>
            ))}
          </div>

          {paginatedWarrants.length === 0 && (
            <div className="py-12 text-center text-gray-500">No warrant records found for the selected criteria.</div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-600">
              Showing {filteredWarrants.length === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredWarrants.length)} of {filteredWarrants.length} warrants
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedWarrant)} onOpenChange={(open) => !open && closePanels()}>
        {selectedWarrant && (
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>{editingWarrant ? 'Edit Warrant' : 'Warrant Details'}</DialogTitle>
              <DialogDescription>
                {editingWarrant
                  ? `Update the warrant record for ${selectedWarrant.name}.`
                  : `Review the full warrant record for ${selectedWarrant.name}.`}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              {isAdmin && selectedWarrant.approvalStatus !== 'Approved' && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleApprove(selectedWarrant.id)}
                  disabled={!isBackendReady || activeAction !== null}
                >
                  {isActionBusy('approve', selectedWarrant.id) ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Approve'}
                </Button>
              )}
              {canOfficerModify(selectedWarrant) && !editingWarrant && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => openEditPanel(selectedWarrant)}
                  disabled={!isBackendReady || activeAction !== null}
                >
                  Edit
                </Button>
              )}
              {canOfficerModify(selectedWarrant) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(selectedWarrant)}
                  disabled={!isBackendReady || activeAction !== null}
                >
                  Delete
                </Button>
              )}
              <Button type="button" size="sm" variant="outline" onClick={closePanels}>
                Close
              </Button>
            </div>

            {editingWarrant ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={handleEdit} disabled={!isBackendReady || activeAction !== null}>
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditingWarrantId(null)}>
                    Cancel Edit
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(selectedWarrant.photoUrl || selectedWarrant.photoDataUrl) && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-gray-600">Photo</p>
                    <div className="mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                      <img src={selectedWarrant.photoUrl || selectedWarrant.photoDataUrl} alt={selectedWarrant.name} className="h-56 w-full rounded-lg object-cover sm:max-w-sm" />
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{selectedWarrant.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alias</p>
                  <p className="font-medium">{selectedWarrant.alias}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Case Number</p>
                  <p className="font-medium">{selectedWarrant.caseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Offense</p>
                  <p className="font-medium">{selectedWarrant.offense}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Court</p>
                  <p className="font-medium">{selectedWarrant.court}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Judge</p>
                  <p className="font-medium">{selectedWarrant.judge}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date Issued</p>
                  <p className="font-medium">{selectedWarrant.dateIssued}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={statusBadgeClass(getDisplayStatus(selectedWarrant))}>{getDisplayStatus(selectedWarrant)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Barangay</p>
                  <p className="font-medium">{selectedWarrant.barangay}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned Officer</p>
                  <p className="font-medium">{selectedWarrant.assignedOfficer || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Submitted By</p>
                  <p className="font-medium">{selectedWarrant.submittedBy || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approved By</p>
                  <p className="font-medium">{selectedWarrant.approvedBy || 'Not yet approved'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approved At</p>
                  <p className="font-medium">{selectedWarrant.approvedAt || 'Not yet approved'}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{selectedWarrant.address}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-gray-600">Remarks</p>
                  <p className="font-medium">{selectedWarrant.remarks}</p>
                </div>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
