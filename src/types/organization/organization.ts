import type { OrgRequestStatus } from "../../types/enum"
export interface Organization {
  id: string;

  name: string;

  bio?: string | null;

  description?: string | null;

  logo?: string | null;

  logoUrl?: string | null;

  slug: string;

  isVerified?: boolean;

  isve?: boolean;

  status: OrgRequestStatus;

  createdAt: Date;

  owner: OwnerResponseDto | null;

  totalMembers: number;

  totalEvents?: number;
}

export interface PublicOrganizationDto {
  id: string;
  name: string;
  logo?: string | null;
  description?: string | null;
  createdAt: string | Date;
  slug?: string;
}
export interface OwnerResponseDto {
  id: string;

  fullName: string;

  email: string;
}
