export interface Report {
  id: string;

  user: User;

  organization: Organization;

  status: string;

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
}