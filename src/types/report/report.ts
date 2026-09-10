import type { OrgRequestStatus, ReportStatus } from "../enum";

export interface Report {
  id: string;

  user: User;

  organization: Organization;

  status: ReportStatus;

  reason: string;

  createAt: Date;
}

interface User {
  id: string,
  fullName: string;
  email: string;
}

interface Organization {
  id: string,
  name: string;
  status?: OrgRequestStatus;
}
