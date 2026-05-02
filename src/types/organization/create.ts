export interface PayloadOrganizationDto {
  name: string;
  bio?: string | null;
  legalName?: string;
  industry: string;
  address?: string;
  email?: string;
  phone?: string;
  website?: string;
  ownerId: string;
  slug: string;
}

