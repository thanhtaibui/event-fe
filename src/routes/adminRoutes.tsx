import { lazy, useEffect, useMemo, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import { MainAdminLayout } from "../layouts/admin/MainAdminLayout";
import AdminSkeleton from "../components/admin/skeleton/AdminSkeleton";
import "../styles/admin/layout/layout.css";

const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const User = lazy(() => import("../pages/admin/User"));
const Role = lazy(() => import("../pages/admin/Role"));
const Report = lazy(() => import("../pages/admin/Report"));
const Organization = lazy(() => import("../pages/admin/org/Organization"));
const OrganizationDetail = lazy(() => import("../pages/admin/org/OrganizationDetail"));
const OrgVerification = lazy(() => import("../pages/admin/org/OrgVerification"));
const Event = lazy(() => import("../pages/admin/event/Event"));
const EventDetail = lazy(() => import("../pages/admin/event/EventDetail"));
const Membership = lazy(() => import("../pages/admin/Membership"));
import { getAccessToken } from "../constants/authStorage";
import {
  ADMIN_PERMISSION_CODES,
  addPermissionTreeCodes,
  getEffectiveOrgPermissionCodes,
  getJwtPermissionCodes,
  getMembershipRoleId,
  getMembershipRoleName,
  getMembershipSlug,
  hasOrgWorkspacePermissionCodes,
  hasPermission,
  isSuperAdmin as checkSuperAdmin,
  normalizeUserMemberships,
} from "../config/adminPermissionConfig";
import { useOrgsByUser } from "../hooks/admin/org/useOrgsByUser";
import type { JwtPayloadCustom } from "../types/JwtPayloadCustom";
import { roleService } from "../services/admin/role.service";

function OrgWorkspaceGuard() {
  const { slug } = useParams();
  const location = useLocation();
  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return "";

    try {
      return jwtDecode<JwtPayloadCustom>(token).sub || "";
    } catch {
      return "";
    }
  }, []);

  const { data, loading } = useOrgsByUser(currentUserId);
  const memberships = useMemo(() => normalizeUserMemberships(data), [data]);
  const activeMembership = useMemo(() => {
    if (!slug) return false;

    return memberships.find((membership) => getMembershipSlug(membership) === slug);
  }, [memberships, slug]);
  const [rolePermissionCodes, setRolePermissionCodes] = useState<Set<string> | null>(null);
  const [rolePermissionLoading, setRolePermissionLoading] = useState(false);
  const membershipRoleId = activeMembership ? getMembershipRoleId(activeMembership) : "";
  const membershipRoleName = activeMembership ? getMembershipRoleName(activeMembership) : "";

  useEffect(() => {
    let ignore = false;

    async function fetchRolePermissions() {
      await Promise.resolve();

      if (!slug || !activeMembership) {
        if (!ignore) {
          setRolePermissionCodes(null);
          setRolePermissionLoading(false);
        }
        return;
      }

      const baseCodes = getEffectiveOrgPermissionCodes(
        activeMembership,
        currentUserId,
      );
      if (hasOrgWorkspacePermissionCodes(baseCodes)) {
        if (!ignore) {
          setRolePermissionCodes(null);
          setRolePermissionLoading(false);
        }
        return;
      }

      try {
        setRolePermissionLoading(true);
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
      } finally {
        if (!ignore) setRolePermissionLoading(false);
      }
    }

    fetchRolePermissions();

    return () => {
      ignore = true;
    };
  }, [activeMembership, currentUserId, membershipRoleId, membershipRoleName, slug]);

  if (!currentUserId || loading) {
    return <AdminSkeleton variant="dashboard" cards={3} />;
  }

  if (!activeMembership) {
    return <AccessBlocked scope="org" />;
  }

  const orgPermissionCodes = getEffectiveOrgPermissionCodes(
    activeMembership,
    currentUserId,
  );
  rolePermissionCodes?.forEach((code) => orgPermissionCodes.add(code));
  const orgRoutePermission = getOrgRoutePermission(location.pathname, slug || "");

  if (
    orgRoutePermission &&
    rolePermissionLoading &&
    !hasPermission(orgPermissionCodes, orgRoutePermission)
  ) {
    return <AdminSkeleton variant="dashboard" cards={3} />;
  }

  if (
    orgRoutePermission &&
    !hasPermission(orgPermissionCodes, orgRoutePermission)
  ) {
    return <AccessBlocked scope="org" />;
  }

  return <Outlet />;
}

function getOrgRoutePermission(pathname: string, slug: string) {
  const basePath = `/org/${slug}`;
  const modulePath = pathname.replace(basePath, "").split("/").filter(Boolean)[0];

  if (!modulePath || modulePath === "dashboard" || modulePath === "profile") {
    return null;
  }

  const routePermissions: Record<string, string> = {
    events: ADMIN_PERMISSION_CODES.EVENT,
    reports: ADMIN_PERMISSION_CODES.REPORT,
    roles: ADMIN_PERMISSION_CODES.ROLE,
    membership: ADMIN_PERMISSION_CODES.MEMBERSHIP,
  };

  return routePermissions[modulePath] || null;
}

function AccessBlocked({ scope = "admin" }: { scope?: "admin" | "org" }) {
  const isOrg = scope === "org";

  return (
    <main className="access-blocked">
      <section className="access-blocked__card">
        <span className="access-blocked__eyebrow">Access restricted</span>
        <h1>
          {isOrg
            ? "You do not have permission in this organization"
            : "You do not have permission to open Super Admin"}
        </h1>
        <p>
          {isOrg
            ? "Your account must be a member of this organization and have the right role permission to use this feature."
            : "This area is reserved for Super Admin accounts. Please use the user site or switch to an account with the correct permissions."}
        </p>
        <a className="access-blocked__button" href="/app">
          Back to User Site
        </a>
      </section>
    </main>
  );
}

function SuperAdminGuard() {
  const permissionCodes = useMemo(() => getJwtPermissionCodes(), []);

  if (!checkSuperAdmin(permissionCodes)) {
    return <AccessBlocked />;
  }

  return <Outlet />;
}

const adminChildren = [
  {
    index: true,
    element: <Navigate to="dashboard" replace />,
  },
  {
    path: "dashboard",
    element: <Dashboard />,
  },
  {
    path: "users",
    element: <User />,
  },
  {
    path: "reports",
    element: <Report />,
  },
  {
    path: "verifications",
    element: <OrgVerification />,
  },
  {
    path: "roles",
    element: <Role />,
  },
  {
    path: "events",
    children: [
      {
        index: true,
        element: <Event />,
      },
      {
        path: ":id",
        element: <EventDetail />,
      },
    ],
  },
  {
    path: "organizations",
    children: [
      {
        index: true,
        element: <Organization />,
      },
      {
        path: ":slug",
        element: <OrganizationDetail />,
      },
    ],
  },
];

const orgChildren = [
  {
    index: true,
    element: <Navigate to="dashboard" replace />,
  },
  {
    path: "dashboard",
    element: <Dashboard />,
  },
  {
    path: "profile",
    element: <OrganizationDetail />,
  },
  {
    path: "events",
    children: [
      {
        index: true,
        element: <Event />,
      },
      {
        path: ":id",
        element: <EventDetail />,
      },
    ],
  },
  {
    path: "reports",
    element: <Report />,
  },
  {
    path: "roles",
    element: <Role />,
  },
  {
    path: "membership",
    element: <Membership />,
  },
];

export const adminRoutes = [
  {
    path: "/admin",
    element: (
      <ProtectedRoute>
        <SuperAdminGuard />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <MainAdminLayout />,
        children: adminChildren,
      },
    ],
  },
  {
    path: "/org/:slug",
    element: (
      <ProtectedRoute>
        <OrgWorkspaceGuard />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <MainAdminLayout />,
        children: orgChildren,
      },
    ],
  },
];
