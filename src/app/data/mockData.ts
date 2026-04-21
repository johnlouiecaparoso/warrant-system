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
  username: string;
  password?: string;
  role: 'Admin' | 'Warrant Officer' | 'Station Commander';
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

export const mockWarrants: Warrant[] = [
  {
    id: '1',
    name: 'Juan Dela Cruz',
    alias: 'JD',
    caseNumber: 'CR-2026-001',
    offense: 'Theft',
    court: 'RTC Branch 5',
    judge: 'Hon. Maria Santos',
    dateIssued: '2026-03-15',
    barangay: 'Barangay 1',
    address: '123 Main St., Butuan City',
    assignedOfficer: 'PO1 Pedro Garcia',
    status: 'Pending',
    remarks: 'First attempt scheduled'
  },
  {
    id: '2',
    name: 'Maria Clara',
    alias: 'MC',
    caseNumber: 'CR-2026-002',
    offense: 'Estafa',
    court: 'RTC Branch 3',
    judge: 'Hon. Roberto Cruz',
    dateIssued: '2026-03-10',
    barangay: 'Barangay 5',
    address: '456 Second Ave., Butuan City',
    assignedOfficer: 'PO2 Jose Reyes',
    status: 'Served',
    remarks: 'Successfully served',
    dateServed: '2026-04-01',
    placeServed: 'Residence'
  },
  {
    id: '3',
    name: 'Pedro Santos',
    alias: 'Pete',
    caseNumber: 'CR-2026-003',
    offense: 'Physical Injury',
    court: 'MTC Butuan',
    judge: 'Hon. Carmen Lopez',
    dateIssued: '2026-02-20',
    barangay: 'Barangay 3',
    address: '789 Third St., Butuan City',
    assignedOfficer: 'PO1 Pedro Garcia',
    status: 'Unserved',
    remarks: 'Subject not found at address',
    reasonUnserved: 'Address incorrect',
    nextAction: 'Verify new address'
  },
  {
    id: '4',
    name: 'Ana Mendoza',
    alias: 'Annie',
    caseNumber: 'CR-2026-004',
    offense: 'Violation of BP 22',
    court: 'RTC Branch 5',
    judge: 'Hon. Maria Santos',
    dateIssued: '2026-03-25',
    barangay: 'Barangay 7',
    address: '321 Fourth Rd., Butuan City',
    assignedOfficer: 'PO3 Miguel Torres',
    status: 'Pending',
    remarks: 'Awaiting assignment'
  },
  {
    id: '5',
    name: 'Carlos Ramos',
    alias: 'Carl',
    caseNumber: 'CR-2026-005',
    offense: 'Drug Possession',
    court: 'RTC Branch 2',
    judge: 'Hon. Diana Reyes',
    dateIssued: '2026-04-01',
    barangay: 'Barangay 2',
    address: '654 Fifth Ave., Butuan City',
    assignedOfficer: 'PO2 Jose Reyes',
    status: 'Served',
    remarks: 'Served at police station',
    dateServed: '2026-04-10',
    placeServed: 'Police Station'
  },
  {
    id: '6',
    name: 'Rosa Martinez',
    alias: 'Rose',
    caseNumber: 'CR-2025-089',
    offense: 'Robbery',
    court: 'RTC Branch 4',
    judge: 'Hon. Fernando Gomez',
    dateIssued: '2025-12-15',
    barangay: 'Barangay 4',
    address: '987 Sixth St., Butuan City',
    assignedOfficer: 'PO3 Miguel Torres',
    status: 'Cancelled',
    remarks: 'Case dismissed'
  }
];

export const mockUsers: User[] = [
  { id: '1', fullName: 'Admin User', username: 'admin', role: 'Admin', status: 'Active' },
  { id: '2', fullName: 'PO1 Pedro Garcia', username: 'pgarcia', role: 'Warrant Officer', status: 'Active' },
  { id: '3', fullName: 'PO2 Jose Reyes', username: 'jreyes', role: 'Warrant Officer', status: 'Active' },
  { id: '4', fullName: 'PO3 Miguel Torres', username: 'mtorres', role: 'Warrant Officer', status: 'Active' },
  { id: '5', fullName: 'PSUPT. Roberto Santos', username: 'rsantos', role: 'Station Commander', status: 'Active' },
  { id: '6', fullName: 'Former Officer', username: 'former', role: 'Warrant Officer', status: 'Inactive' }
];

export const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    user: 'Admin User',
    action: 'Added new warrant',
    module: 'Warrant Encoding',
    dateTime: '2026-04-21 10:30:00',
    ipAddress: '192.168.1.100'
  },
  {
    id: '2',
    user: 'PO2 Jose Reyes',
    action: 'Updated warrant status to Served',
    module: 'Warrant Status',
    dateTime: '2026-04-21 09:15:00',
    ipAddress: '192.168.1.101'
  },
  {
    id: '3',
    user: 'Admin User',
    action: 'Assigned warrant to PO1 Pedro Garcia',
    module: 'Warrant Assignment',
    dateTime: '2026-04-20 14:45:00',
    ipAddress: '192.168.1.100'
  },
  {
    id: '4',
    user: 'PO3 Miguel Torres',
    action: 'Updated warrant status to Unserved',
    module: 'Warrant Status',
    dateTime: '2026-04-20 11:20:00',
    ipAddress: '192.168.1.102'
  },
  {
    id: '5',
    user: 'Admin User',
    action: 'Deleted warrant record',
    module: 'Warrant Management',
    dateTime: '2026-04-19 16:00:00',
    ipAddress: '192.168.1.100'
  }
];
