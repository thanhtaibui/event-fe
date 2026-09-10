import "../../../styles/admin/layout/layout.css";
import { SidebarItem } from "./SlideBarItem";
import { useLocation, useParams } from "react-router-dom";
import {
  addPermissionTreeCodes,
  getAllowedOrgWorkspaceSidebarItems,
  getEffectiveOrgPermissionCodes,
  getJwtPermissionCodes,
  getMembershipRoleId,
  getMembershipRoleName,
  getMembershipSlug,
  hasOrgWorkspacePermissionCodes,
  getSystemAdminSidebarItems,
  normalizeUserMemberships,
} from "../../../config/adminPermissionConfig";
import { getAccessToken } from "../../../constants/authStorage";
import { jwtDecode } from "jwt-decode";
import { useEffect, useMemo, useState } from "react";
import { useOrgsByUser } from "../../../hooks/admin/org/useOrgsByUser";
import type { JwtPayloadCustom } from "../../../types/JwtPayloadCustom";
import { roleService } from "../../../services/admin/role.service";
type SidebarProps = {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
};

export const Sidebar = ({ isCollapsed, onToggleSidebar }: SidebarProps) => {
  const location = useLocation();
  const { slug } = useParams();
  const isOrgWorkspace = location.pathname.startsWith("/org/") && Boolean(slug);
  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return "";

    try {
      return jwtDecode<JwtPayloadCustom>(token).sub || "";
    } catch {
      return "";
    }
  }, []);
  const { data } = useOrgsByUser(isOrgWorkspace ? currentUserId : "");
  const orgMembership = useMemo(() => {
    if (!isOrgWorkspace || !slug) return null;
    return normalizeUserMemberships(data).find(
      (membership) => getMembershipSlug(membership) === slug,
    ) || null;
  }, [data, isOrgWorkspace, slug]);
  const [rolePermissionCodes, setRolePermissionCodes] = useState<Set<string> | null>(null);
  const membershipRoleId = getMembershipRoleId(orgMembership);
  const membershipRoleName = getMembershipRoleName(orgMembership);

  useEffect(() => {
    let ignore = false;

    async function fetchRolePermissions() {
      await Promise.resolve();

      if (!isOrgWorkspace || !slug || !orgMembership) {
        if (!ignore) setRolePermissionCodes(null);
        return;
      }

      const baseCodes = getEffectiveOrgPermissionCodes(
        orgMembership,
        currentUserId,
      );
      if (hasOrgWorkspacePermissionCodes(baseCodes)) {
        if (!ignore) setRolePermissionCodes(null);
        return;
      }

      try {
        let roleId = membershipRoleId;

        if (!roleId && membershipRoleName) {
          const rolesRes = await roleService.getRolesByOrgSlug(slug || "", {
            page: 1,
            limit: 100,
          });
          const roles = rolesRes?.data?.items || rolesRes?.items || [];
          roleId =
            roles.find(
              (role: { id?: string; role_name?: string; roleName?: string }) =>
                (role.role_name || role.roleName || "").toLowerCase() ===
                membershipRoleName.toLowerCase(),
            )?.id || "";
        }

        if (!roleId) {
          if (!ignore) setRolePermissionCodes(null);
          return;
        }

        const res = await roleService.getRolePermissions(roleId);
        const permissions = res?.data?.permissions || [];
        const nextCodes = addPermissionTreeCodes(new Set<string>(), permissions);

        if (!ignore) setRolePermissionCodes(nextCodes);
      } catch {
        if (!ignore) setRolePermissionCodes(null);
      }
    }

    fetchRolePermissions();

    return () => {
      ignore = true;
    };
  }, [currentUserId, isOrgWorkspace, membershipRoleId, membershipRoleName, orgMembership, slug]);

  const permissionCodes = useMemo(() => {
    const baseCodes = isOrgWorkspace && orgMembership
      ? getEffectiveOrgPermissionCodes(orgMembership, currentUserId)
      : getJwtPermissionCodes();

    rolePermissionCodes?.forEach((code) => baseCodes.add(code));
    return baseCodes;
  }, [currentUserId, isOrgWorkspace, orgMembership, rolePermissionCodes]);
  const visibleItems = isOrgWorkspace
    ? getAllowedOrgWorkspaceSidebarItems(permissionCodes)
    : getSystemAdminSidebarItems();
  const basePath =
    isOrgWorkspace && slug ? `/org/${slug}` : "/admin";

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <button className="toggle-btn" onClick={onToggleSidebar}>
        {isCollapsed ? (
          <img
            width="25"
            height="25"
            src="https://img.icons8.com/ios-glyphs/25/forward.png"
            alt="back"
          />
        ) : (
          <img
            width="25"
            height="25"
            src="https://img.icons8.com/ios-glyphs/30/back.png"
            alt="forward"
          />
        )}
      </button>
      <div className="logo">
        <img src="/logo-event.png" alt="event logo" />
      </div>
      <nav className="sidebar-nav">
        <ul>
          {visibleItems.map((item) => (
            <SidebarItem
              key={item.key}
              to={item.path.replace("/admin", basePath)}
              label={item.label}
              icon={item.icon}
              activeIcon={item.activeIcon}
              isCollapsed={isCollapsed}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
};
