import { Warrant } from '../data/models';

export function getDisplayStatus(warrant: Warrant): string {
  if (warrant.approvalStatus === 'Approved' && warrant.status === 'Pending') {
    return 'Arrested';
  }

  switch (warrant.status) {
    case 'Pending':
      return 'At Large';
    case 'Served':
      return 'Served';
    case 'Unserved':
      return 'Unserved';
    case 'Cancelled':
      return 'Dismissed';
    case 'Quashed':
      return 'Quashed';
    default:
      return warrant.status;
  }
}

export function isDisplayPending(warrant: Warrant): boolean {
  return getDisplayStatus(warrant) === 'At Large';
}
