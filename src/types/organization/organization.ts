import type { OrgRequestStatus } from "../../types/enum"
export interface Organization {
  id: string;

  name: string;

  bio: string | null;

  slug: string;

  isActive: boolean;

  status: OrgRequestStatus;

  createdAt: Date;

  owner: OwnerResponseDto | null;

  totalMembers: number;

  totalEvents?: number;
}
export interface OwnerResponseDto {
  id: string;

  fullName: string;

  email: string;
}