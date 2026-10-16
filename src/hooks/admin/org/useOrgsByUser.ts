import { useCallback, useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { userService } from "../../../services/admin/user.service";
import { getAccessToken } from "../../../constants/authStorage";
import type { User } from "../../../types/user/user";

export const ALLOWED_ORGANIZATION_ROLES = [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "SUPERADMIN",
  "SUPER_ADMIN",
  "ORG_OWNER",
  "ORG_ADMIN",
  "ORG_MEMBER",
  "ORGANIZATION_OWNER",
  "ORGANIZATION_ADMIN",
  "ORGANIZATION_MEMBER",
];

export function isAllowedOrgRole(roleInput: unknown): boolean {
  if (!roleInput) return false;

  if (typeof roleInput === "string") {
    const normalized = roleInput.trim().toUpperCase();
    if (normalized === "GUEST" || normalized.includes("GUEST")) {
      return false;
    }
    return ALLOWED_ORGANIZATION_ROLES.some(
      (allowed) => normalized === allowed || normalized.includes(allowed),
    );
  }

  if (Array.isArray(roleInput)) {
    if (roleInput.length === 0) return false;
    return roleInput.some((item) => isAllowedOrgRole(item));
  }

  if (typeof roleInput === "object" && roleInput !== null) {
    const obj = roleInput as Record<string, unknown>;
    if (obj.isSuperAdmin) return true;
    if (obj.isOwner) return true;

    const candidateRoles = [
      obj.name,
      obj.roleName,
      obj.role_name,
      obj.code,
      obj.roleCode,
      obj.role_code,
      obj.role,
    ];

    for (const cand of candidateRoles) {
      if (typeof cand === "string") {
        const norm = cand.trim().toUpperCase();
        if (norm === "GUEST" || norm.includes("GUEST")) return false;
        if (
          ALLOWED_ORGANIZATION_ROLES.some(
            (allowed) => norm === allowed || norm.includes(allowed),
          )
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

export function canFetchUserOrganizations(user?: User | null): boolean {
  // 1. Check user info if available
  if (user) {
    if (isAllowedOrgRole(user.role)) return true;
    if ((user as any).roles && isAllowedOrgRole((user as any).roles)) return true;
    if ((user as any).roleName && isAllowedOrgRole((user as any).roleName)) return true;
    if ((user as any).roleCode && isAllowedOrgRole((user as any).roleCode)) return true;

    return false;
  }

  // 2. Check access token payload
  const token = getAccessToken();
  if (!token) return false;

  try {
    const decoded = jwtDecode<Record<string, unknown>>(token);

    if (
      typeof decoded.role === "string" &&
      decoded.role.trim().toUpperCase() === "GUEST"
    ) {
      return false;
    }
    if (
      Array.isArray(decoded.roles) &&
      decoded.roles.some(
        (r: any) => typeof r === "string" && r.trim().toUpperCase() === "GUEST",
      )
    ) {
      return false;
    }

    if (decoded.role && isAllowedOrgRole(decoded.role)) return true;
    if (decoded.roles && isAllowedOrgRole(decoded.roles)) return true;
    if (decoded.role_name && isAllowedOrgRole(decoded.role_name)) return true;
    if (decoded.roleName && isAllowedOrgRole(decoded.roleName)) return true;
    if (decoded.role_code && isAllowedOrgRole(decoded.role_code)) return true;
    if (decoded.roleCode && isAllowedOrgRole(decoded.roleCode)) return true;

    const roleObj = decoded.role as any;
    if (roleObj && typeof roleObj === "object") {
      if (roleObj.isSuperAdmin) return true;
      if (Array.isArray(roleObj.permissions) && roleObj.permissions.length > 0)
        return true;
    }

    return false;
  } catch {
    return false;
  }
}

type UseOrgsByUserOptions = {
  enabled?: boolean;
};

export const useOrgsByUser = (id: string, options?: UseOrgsByUserOptions) => {
  const isEnabled =
    options?.enabled !== undefined
      ? options.enabled
      : canFetchUserOrganizations();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(id && isEnabled));
  const [error, setError] = useState<unknown>(null);
  const requestRef = useRef(0);

  const fetchOrgs = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!id || !isEnabled) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setData(null);
      setError(null);
      setLoading(true);
      const res = await userService.getOrgsByUser(id);
      if (requestRef.current === requestId) setData(res?.data ?? res);
    } catch (err) {
      if (requestRef.current === requestId) {
        setData(null);
        setError(err);
      }
    } finally {
      if (requestRef.current === requestId) setLoading(false);
    }
  }, [id, isEnabled]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  return { data, loading, error, refetch: fetchOrgs };
};
