// Dùng const object + as const
export const OrgRequestStatus = {
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  SUSPENDED: 'SUSPENDED'
} as const;

// Tạo Type để dùng trong code
export type OrgRequestStatus = typeof OrgRequestStatus[keyof typeof OrgRequestStatus];

export const EventStatus = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  ENDED: 'ended',
  CANCELLED: 'cancelled'
} as const;

export type EventStatus = typeof EventStatus[keyof typeof EventStatus];
