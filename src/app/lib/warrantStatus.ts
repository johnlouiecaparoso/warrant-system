import { Warrant } from '../data/models';

export function getDisplayStatus(warrant: Warrant): string {
  if (warrant.approvalStatus === 'Approved' && warrant.status === 'Pending') {
    return 'Approved';
  }

  return warrant.status;
}

export function isDisplayPending(warrant: Warrant): boolean {
  return getDisplayStatus(warrant) === 'Pending';
}
