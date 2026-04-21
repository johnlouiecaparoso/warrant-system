export interface Warrant {
  id: string;
  name: string;
  alias: string;
  caseNumber: string;
  offense: string;
  court: string;
  judge: string;
  dateIssued: string;
  barangay: string;
  address: string;
  assignedOfficer: string;
  dateAssigned?: string;
  assignmentNotes?: string;
  status: 'Pending' | 'Served' | 'Unserved' | 'Cancelled';
  approvalStatus: 'For Approval' | 'Approved';
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks: string;
  dateServed?: string;
  placeServed?: string;
  servedRemarks?: string;
  reasonUnserved?: string;
  nextAction?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'Admin' | 'Warrant Officer';
  status: 'Active' | 'Inactive';
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  module: string;
  dateTime: string;
  ipAddress: string;
}

export interface AppSettings {
  id: string;
  officeName: string;
  notifyOverdue: boolean;
  notifyPending: boolean;
}
