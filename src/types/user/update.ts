import type { Membership } from "../membership/membership";

export interface UpdateUser {
  fullName: string;
  phoneNumber: string;
  memberships: Membership[],
}