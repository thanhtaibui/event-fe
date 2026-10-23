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

export interface LookupOrganizationPaymentAccountDto {
  bankBin: string;
  accountNumber: string;
  accountName?: string;
  accountHolderName?: string;
}

export interface LookupOrganizationPaymentAccountResponse {
  valid: boolean;
  bankBin: string;
  bankName?: string;
  accountNumber: string;
  accountName: string;
  verificationToken?: string;
  message?: string;
  reason?: string;
}

export interface UpsertOrganizationPaymentAccountDto {
  bankBin: string;
  accountNumber: string;
  accountHolderName: string;
  bankName?: string;
  accountName?: string;
  verificationToken?: string;
}

export type PaymentAccountVerificationStatus = "PENDING" | "VERIFIED" | "FAILED";

export interface OrganizationPaymentAccountResponse {
  id?: string;
  organizationId?: string;
  bankBin?: string;
  bankName?: string;
  accountName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  maskedAccountNumber?: string;
  verificationStatus?: PaymentAccountVerificationStatus;
  verifiedAccountName?: string | null;
  verifiedAt?: string | Date | null;
  verificationProvider?: string | null;
  verificationFailureReason?: string | null;
  isConfigured?: boolean;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
