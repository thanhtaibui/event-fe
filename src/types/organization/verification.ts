import type { Organization } from "./organization";

export type OrgVerificationStatus =
  | "PENDING"
  | "PROCESSING"
  | "APPROVED"
  | "REJECTED";

export type OrgVerificationRequest = {
  id: string;
  organizationId?: string;
  organization?: Pick<Organization, "id" | "name" | "slug" | "owner">;
  taxIdNumber?: string;
  taxNumber?: string;
  documentUrl?: string;
  status?: OrgVerificationStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  reviewedAt?: string | Date | null;
  reviewerNote?: string | null;
};

export type CreateOrgVerificationPayload = {
  organizationId: string;
  taxIdNumber: string;
  documentUrl: string;
};

export type UpdateOrgVerificationPayload = {
  status: Exclude<OrgVerificationStatus, "PENDING">;
  reviewerNote?: string;
};

