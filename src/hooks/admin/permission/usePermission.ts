import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  getJwtPermissionCodes,
  getMembershipOrganizationId,
  getMembershipSlug,
  isOrgOwnerForUser,
  isSuperAdmin,
  normalizeUserMemberships,
} from "../../../config/adminPermissionConfig";
import { getAccessToken } from "../../../constants/authStorage";
import { permissionService } from "../../../services/admin/permission.service";
import type { PermissionTree } from "../../../types/permission/permissionTree";
import type { JwtPayloadCustom } from "../../../types/JwtPayloadCustom";

import { useOrgsByUser } from "../org/useOrgsByUser";
import { useOrgBySlug } from "../org/useOrgBySlug";

type PermissionActorRole = "SUPER_ADMIN" | "OWNER";

type RawPermission = PermissionTree & {
  _id?: string;
  permission?: RawPermission;
  permissionId?: string;
  permission_id?: string;
  name?: string;
  title?: string;
  label?: string;
  code?: string;
  module?: string;
  moduleName?: string;
  resource?: string;
  action?: string;
  description?: string;
  permissionName?: string;
  permission_code?: string;
  parentId?: string;
  parent_id?: string;
  parentPermissionId?: string;
  parent?: {
    id?: string;
    _id?: string;
  };
  children?: RawPermission[];
};

function getPermissionId(permission: RawPermission) {
  const source = permission.permission || permission;
  return String(
    source.id ||
      source._id ||
      source.permissionId ||
      source.permission_id ||
      source.permission_code ||
      source.code ||
      "",
  );
}

function getPermissionName(permission: RawPermission) {
  const source = permission.permission || permission;
  const moduleAction =
    source.module || source.moduleName || source.resource
      ? [source.module || source.moduleName || source.resource, source.action]
          .filter(Boolean)
          .join(" · ")
      : "";

  return (
    source.permission_name ||
    source.permissionName ||
    source.label ||
    source.title ||
    source.name ||
    moduleAction ||
    source.description ||
    source.permission_code ||
    source.code ||
    "Permission"
  );
}

function getParentId(permission: RawPermission) {
  const source = permission.permission || permission;
  return String(
    source.parentId ||
      source.parent_id ||
      source.parentPermissionId ||
      source.parent?.id ||
      source.parent?._id ||
      "",
  );
}

function normalizePermission(permission: RawPermission): PermissionTree {
  return {
    id: getPermissionId(permission),
    permission_name: getPermissionName(permission),
    children: permission.children?.map(normalizePermission),
  };
}

function normalizePermissionList(items: RawPermission[]): PermissionTree[] {
  const hasParentRelation = items.some((item) => getParentId(item));
  if (!hasParentRelation) return items.map(normalizePermission);

  const nodeById = new Map<string, PermissionTree>();

  items.forEach((item) => {
    const id = getPermissionId(item);
    if (!id) return;
    nodeById.set(id, {
      id,
      permission_name: getPermissionName(item),
      children: item.children?.map(normalizePermission) || [],
    });
  });

  const roots: PermissionTree[] = [];

  items.forEach((item) => {
    const id = getPermissionId(item);
    const node = nodeById.get(id);
    if (!node) return;

    const parent = nodeById.get(getParentId(item));
    if (parent) {
      parent.children = [...(parent.children || []), node];
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function unwrapPermissions(value: unknown): PermissionTree[] {
  if (Array.isArray(value)) return normalizePermissionList(value as RawPermission[]);

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const keys = ["permissions", "items", "data"];

    for (const key of keys) {
      const nested = payload[key];
      const result = unwrapPermissions(nested);
      if (result.length) return result;
    }
  }

  return [];
}

function getCurrentUserId() {
  const token = getAccessToken();
  if (!token) return "";

  try {
    return jwtDecode<JwtPayloadCustom>(token).sub || "";
  } catch {
    return "";
  }
}

export const UsePermission = () => {
  const location = useLocation();
  const { slug } = useParams();
  const isOrgWorkspace = location.pathname.startsWith("/org/") && Boolean(slug);
  const currentUserId = useMemo(getCurrentUserId, []);
  const { data: membershipData, loading: membershipLoading } = useOrgsByUser(
    isOrgWorkspace ? currentUserId : "",
  );
  const { data: activeOrgBySlug, loading: activeOrgLoading } = useOrgBySlug(
    isOrgWorkspace ? slug || "" : "",
  );
  const [data, setData] = useState<PermissionTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const activeMembership = useMemo(() => {
    if (!isOrgWorkspace || !slug || membershipLoading) return null;

    return (
      normalizeUserMemberships(membershipData).find(
        (membership) => getMembershipSlug(membership) === slug,
      ) || null
    );
  }, [currentUserId, isOrgWorkspace, membershipData, membershipLoading, slug]);

  const actorRole = useMemo<PermissionActorRole | null>(() => {
    if (!isOrgWorkspace) {
      return isSuperAdmin(getJwtPermissionCodes()) ? "SUPER_ADMIN" : null;
    }

    if (!slug || membershipLoading) return null;

    return activeMembership && isOrgOwnerForUser(activeMembership, currentUserId)
      ? "OWNER"
      : null;
  }, [activeMembership, currentUserId, isOrgWorkspace, membershipLoading, slug]);

  const actorOrganizationId =
    actorRole === "OWNER"
      ? getMembershipOrganizationId(activeMembership) || activeOrgBySlug?.id || ""
      : "";
  const actorOrganizationLoading =
    isOrgWorkspace &&
    (membershipLoading ||
      (actorRole === "OWNER" &&
        !getMembershipOrganizationId(activeMembership) &&
        activeOrgLoading));

  const fetchPermissions = async () => {
    if (isOrgWorkspace && membershipLoading) {
      setLoading(true);
      return;
    }

    if (!actorRole) {
      setData([]);
      setError("You do not have permission to manage role permissions.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setData([]);

    try {
      const res =
        actorRole === "SUPER_ADMIN"
          ? await permissionService.getSuperAdminPermissions()
          : await permissionService.getOwnerPermissions();

      setData(unwrapPermissions(res));
    } catch (error) {
      console.error("Fetch permissions error:", error);
      setError("Could not load permissions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [actorRole, isOrgWorkspace, membershipLoading]);

  return {
    data,
    loading,
    error,
    actorRole,
    actorOrganizationId,
    actorOrganizationLoading,
    refetch: fetchPermissions,
  };
}
