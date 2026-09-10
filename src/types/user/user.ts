export interface User {
  id: string,
  email: string;

  fullName: string;

  phoneNumber: string;

  isActive: boolean;

  role: UserMembership[] | string;
}

export interface UserMembership {
    id?: string;
    name?: string;
    isOwner?: boolean;
    ownerId?: string;
    orgId?: string;
    organizationId?: string;
    slug?: string;
    orgSlug?: string;
    organizationSlug?: string;
    orgName?: string;
    organizationName?: string;
    organization?: {
        id?: string;
        name?: string;
        slug?: string;
        isVerified?: boolean;
        isve?: boolean;
        ownerId?: string;
        owner?: {
            id?: string;
        };
    };
    roleId?: string;
    roleName?: string;
    roleCode?: string;
    role?: {
        id?: string;
        name?: string;
        code?: string;
        role_name?: string;
        role_code?: string;
        permissions?: UserPermission[];
    };
    role_name?: string;
    role_code?: string;
    colorKey?: string;
    permissions?: UserPermission[];
}

export interface UserPermission {
  permission_name?: string;
  permission_code?: string;
  children?: UserPermission[];
  isAll?: boolean;
}
