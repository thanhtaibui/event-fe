import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "../constants/authStorage";
import type { User, UserMembership, UserPermission } from "../types/user/user";

export const ADMIN_PERMISSION_CODES = {
  USER: "USER",
  ROLE: "ROLE",
  EVENT: "EVENT",
  REPORT: "REPORT",
  MEMBERSHIP: "MEMBERSHIP",
  VIEW_REPORT: "VIEW_REPORT",
  EXPORT_REPORT: "EXPORT_REPORT",
  DOWNLOAD_REPORT: "DOWNLOAD_REPORT",
  CREATE_USER: "CREATE_USER",
  UPDATE_USER: "UPDATE_USER",
  DELETE_USER: "DELETE_USER",
  CREATE_ROLE: "CREATE_ROLE",
  UPDATE_ROLE: "UPDATE_ROLE",
  CREATE_EVENT: "CREATE_EVENT",
  DELETE_EVENT: "DELETE_EVENT",
} as const;

export type AdminPermissionCode =
  (typeof ADMIN_PERMISSION_CODES)[keyof typeof ADMIN_PERMISSION_CODES];

export type AdminSidebarPermission = {
  key:
    | "dashboard"
    | "users"
    | "organizations"
    | "roles"
    | "events"
    | "reports"
    | "membership"
    | "verifications";
  label: string;
  path: string;
  permissionCode?: AdminPermissionCode;
  superOnly?: boolean;
  icon: string;
  activeIcon: string;
  children: Partial<Record<"view" | "create" | "update" | "delete" | "export" | "download", AdminPermissionCode>>;
};

export const ADMIN_SIDEBAR_PERMISSIONS: AdminSidebarPermission[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    superOnly: true,
    icon: "https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/control-panel.png",
    activeIcon: "https://img.icons8.com/nolan/96/control-panel.png",
    children: {},
  },
  {
    key: "users",
    label: "User",
    path: "/admin/users",
    permissionCode: ADMIN_PERMISSION_CODES.USER,
    icon: "https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/test-account.png",
    activeIcon: "https://img.icons8.com/nolan/64/test-account.png",
    children: {
      create: ADMIN_PERMISSION_CODES.CREATE_USER,
      update: ADMIN_PERMISSION_CODES.UPDATE_USER,
      delete: ADMIN_PERMISSION_CODES.DELETE_USER,
    },
  },
  {
    key: "organizations",
    label: "Organizations",
    path: "/admin/organizations",
    superOnly: true,
    icon: "https://img.icons8.com/nolan/64/B0B0B0/2E2E2E/organization.png",
    activeIcon: "https://img.icons8.com/nolan/64/organization.png",
    children: {},
  },
  {
    key: "verifications",
    label: "Verifications",
    path: "/admin/verifications",
    superOnly: true,
    icon: "https://img.icons8.com/nolan/64/B0B0B0/2E2E2E/approval.png",
    activeIcon: "https://img.icons8.com/nolan/64/approval.png",
    children: {},
  },
  {
    key: "roles",
    label: "Roles",
    path: "/admin/roles",
    permissionCode: ADMIN_PERMISSION_CODES.ROLE,
    icon: "https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/user-shield.png",
    activeIcon: "https://img.icons8.com/nolan/64/user-shield.png",
    children: {
      create: ADMIN_PERMISSION_CODES.CREATE_ROLE,
      update: ADMIN_PERMISSION_CODES.UPDATE_ROLE,
    },
  },
  {
    key: "events",
    label: "Events",
    path: "/admin/events",
    permissionCode: ADMIN_PERMISSION_CODES.EVENT,
    icon: "https://img.icons8.com/nolan/64/B0B0B0/2E2E2E/event-accepted.png",
    activeIcon: "https://img.icons8.com/nolan/64/event-accepted.png",
    children: {
      create: ADMIN_PERMISSION_CODES.CREATE_EVENT,
      delete: ADMIN_PERMISSION_CODES.DELETE_EVENT,
    },
  },
  {
    key: "reports",
    label: "Reports",
    path: "/admin/reports",
    permissionCode: ADMIN_PERMISSION_CODES.REPORT,
    icon: "https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/ratings.png",
    activeIcon: "https://img.icons8.com/nolan/64/ratings.png",
    children: {
      view: ADMIN_PERMISSION_CODES.VIEW_REPORT,
      export: ADMIN_PERMISSION_CODES.EXPORT_REPORT,
      download: ADMIN_PERMISSION_CODES.DOWNLOAD_REPORT,
    },
  },
  {
    key: "membership",
    label: "Membership",
    path: "/admin/membership",
    permissionCode: ADMIN_PERMISSION_CODES.MEMBERSHIP,
    icon: "https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/conference-call.png",
    activeIcon: "https://img.icons8.com/nolan/64/conference-call.png",
    children: {},
  },
];

export const ORG_WORKSPACE_SIDEBAR_PERMISSIONS: AdminSidebarPermission[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    superOnly: true,
    icon: "https://img.icons8.com/nolan/96/B0B0B0/2E2E2E/control-panel.png",
    activeIcon: "https://img.icons8.com/nolan/96/control-panel.png",
    children: {},
  },
  ...ADMIN_SIDEBAR_PERMISSIONS.filter((item) =>
    ["events", "reports", "roles", "membership"].includes(item.key),
  ),
];

export function getOrgWorkspaceSidebarItems() {
  return ORG_WORKSPACE_SIDEBAR_PERMISSIONS;
}

export function getSystemAdminSidebarItems() {
  return ADMIN_SIDEBAR_PERMISSIONS.filter((item) => item.key !== "membership");
}

type JwtPermissionPayload = {
  role?:
    | string
    | string[]
    | {
        isSuperAdmin?: boolean;
        permissions?: string[];
      };
  roles?: string[];
  permissions?: string[];
};

function normalizeCode(value: string) {
  return value.trim().toUpperCase();
}

function flattenPermissionCodes(permissions: UserPermission[] = []): string[] {
  return permissions.flatMap((permission) => [
    permission.permission_code || "",
    ...flattenPermissionCodes(permission.children || []),
  ]);
}

function normalizeRoleName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim()
    .toUpperCase();
}

export function getMembershipRoleId(membership?: UserMembership | null) {
  return membership?.role?.id || membership?.roleId || "";
}

export function getMembershipRoleName(membership?: UserMembership | null) {
  return (
    membership?.role?.role_name ||
    membership?.role?.name ||
    membership?.roleName ||
    membership?.role_name ||
    membership?.role?.role_code ||
    membership?.role?.code ||
    membership?.roleCode ||
    membership?.role_code ||
    ""
  );
}

export function isOrgOwnerMembership(membership?: UserMembership | null) {
  if (!membership) return false;
  if (membership.isOwner) return true;

  const role = normalizeRoleName(getMembershipRoleName(membership));

  return [
    "OWNER",
    "ORG_OWNER",
    "ORGANIZATION_OWNER",
    "CHU",
    "CHU TO CHUC",
    "HOST",
    "ADMIN",
    "ORG_ADMIN",
    "ORGANIZATION_ADMIN",
  ].some((alias) => role === alias || role.includes(alias));
}

export function isOrgOwnerForUser(
  membership?: UserMembership | null,
  userId?: string,
) {
  if (isOrgOwnerMembership(membership)) return true;
  if (!membership || !userId) return false;

  return (
    membership.ownerId === userId ||
    membership.organization?.ownerId === userId ||
    membership.organization?.owner?.id === userId
  );
}

export function getOrgWorkspaceRoleLabel(
  membership?: UserMembership | null,
  currentUserId?: string,
) {
  const roleName = getMembershipRoleName(membership);

  if (isOrgOwnerForUser(membership, currentUserId)) return "Organization Owner";
  return roleName ? `Staff · ${roleName}` : "Staff";
}

export function getOrgWorkspaceFullPermissionCodes() {
  return new Set<string>(Object.values(ADMIN_PERMISSION_CODES).map(normalizeCode));
}

export function addPermissionTreeCodes(
  codes: Set<string>,
  permissions: UserPermission[] = [],
) {
  flattenPermissionCodes(permissions).forEach((code) => {
    if (code) codes.add(normalizeCode(code));
  });

  return codes;
}

export function hasOrgWorkspacePermissionCodes(codes: Set<string>) {
  return [
    ADMIN_PERMISSION_CODES.EVENT,
    ADMIN_PERMISSION_CODES.REPORT,
    ADMIN_PERMISSION_CODES.ROLE,
    ADMIN_PERMISSION_CODES.MEMBERSHIP,
  ].some((code) => codes.has(code));
}

export function getPermissionCodesFromMembership(membership: UserMembership) {
  return new Set(
    [
      membership.role?.code || "",
      membership.role?.role_code || "",
      membership.role?.role_name || "",
      membership.role?.name || "",
      membership.role_code || "",
      membership.roleCode || "",
      membership.role_name || "",
      membership.roleName || "",
      ...(membership.role?.permissions
        ? flattenPermissionCodes(membership.role.permissions)
        : []),
      ...flattenPermissionCodes(membership.permissions || []),
    ]
      .filter(Boolean)
      .map(normalizeCode),
  );
}

export function getEffectiveOrgPermissionCodes(
  membership: UserMembership,
  currentUserId?: string,
) {
  const membershipCodes = getPermissionCodesFromMembership(membership);
  if (isOrgOwnerForUser(membership, currentUserId)) {
    return getOrgWorkspaceFullPermissionCodes();
  }

  return membershipCodes;
}

export function normalizeUserMemberships(value: unknown): UserMembership[] {
  if (Array.isArray(value)) return value as UserMembership[];

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const arrayKeys = [
      "items",
      "organizations",
      "memberships",
      "membership",
      "orgs",
      "roles",
    ];

    for (const key of arrayKeys) {
      if (Array.isArray(payload[key])) {
        return payload[key] as UserMembership[];
      }
    }

    if (payload.data && typeof payload.data === "object") {
      return normalizeUserMemberships(payload.data);
    }
  }

  return [];
}

export function getMembershipSlug(membership: UserMembership) {
  return (
    membership.organization?.slug ||
    membership.slug ||
    membership.orgSlug ||
    membership.organizationSlug ||
    ""
  );
}

export function getJwtPermissionCodes() {
  const token = getAccessToken();
  if (!token) return new Set<string>();

  try {
    const decoded = jwtDecode<JwtPermissionPayload>(token);
    const roleCodes = Array.isArray(decoded.role)
      ? decoded.role
      : typeof decoded.role === "string"
        ? [decoded.role]
        : [];
    const rolePermissions =
      decoded.role && typeof decoded.role === "object" && !Array.isArray(decoded.role)
        ? decoded.role.permissions || []
        : [];
    const superAdminCode =
      decoded.role &&
      typeof decoded.role === "object" &&
      !Array.isArray(decoded.role) &&
      decoded.role.isSuperAdmin
        ? ["SUPERADMIN"]
        : [];

    return new Set(
      [
        ...roleCodes,
        ...rolePermissions,
        ...superAdminCode,
        ...(decoded.roles || []),
        ...(decoded.permissions || []),
      ]
        .filter(Boolean)
        .map(normalizeCode),
    );
  } catch {
    return new Set<string>();
  }
}

export function getUserPermissionCodes(user?: User | null) {
  const codes = getJwtPermissionCodes();
  const memberships = Array.isArray(user?.role) ? user.role : [];

  memberships.forEach((membership) => {
    getPermissionCodesFromMembership(membership).forEach((code) => codes.add(code));
  });

  return codes;
}

export function isSuperAdmin(codes: Set<string>) {
  return codes.has("SUPERADMIN") || codes.has("SUPER_ADMIN");
}

export function hasPermission(codes: Set<string>, permissionCode: string) {
  return isSuperAdmin(codes) || codes.has(normalizeCode(permissionCode));
}

export function getAllowedSidebarItems(codes: Set<string>) {
  if (isSuperAdmin(codes)) return getSystemAdminSidebarItems();

  return ADMIN_SIDEBAR_PERMISSIONS.filter((item) =>
    item.permissionCode && hasPermission(codes, item.permissionCode),
  );
}

export function getAllowedOrgWorkspaceSidebarItems(codes: Set<string>) {
  return ORG_WORKSPACE_SIDEBAR_PERMISSIONS.filter((item) => {
    if (item.key === "dashboard") return true;
    return Boolean(item.permissionCode && hasPermission(codes, item.permissionCode));
  });
}

export function getFirstAllowedAdminPath(codes: Set<string>) {
  return getAllowedSidebarItems(codes)[0]?.path || "/admin/dashboard";
}

export function canAccessAdminAction(
  codes: Set<string>,
  parentCode: AdminPermissionCode,
  action: keyof AdminSidebarPermission["children"],
) {
  const parent = ADMIN_SIDEBAR_PERMISSIONS.find(
    (item) => item.permissionCode === parentCode,
  );
  const actionCode = parent?.children[action];

  return Boolean(actionCode && hasPermission(codes, actionCode));
}
