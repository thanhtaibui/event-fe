import { useMemo } from "react";
import { Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  Mail,
  Phone,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";

import { getAccessToken } from "../../constants/authStorage";
import { getUserPermissionCodes, isSuperAdmin as checkSuperAdmin } from "../../config/adminPermissionConfig";
import { useOrgsByUser, canFetchUserOrganizations } from "../../hooks/admin/org/useOrgsByUser";
import { useInfo } from "../../hooks/layout/useInfo";
import type { JwtPayloadCustom } from "../../types/JwtPayloadCustom";
import type { UserMembership } from "../../types/user/user";

import "../../styles/user/profile/userProfile.css";

function getTokenUser() {
  const token = getAccessToken();
  if (!token) return null;

  try {
    return jwtDecode<JwtPayloadCustom>(token);
  } catch {
    return null;
  }
}

function normalizeMemberships(value: unknown): UserMembership[] {
  if (Array.isArray(value)) return value as UserMembership[];

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const arrayKeys = ["items", "organizations", "memberships", "membership", "orgs", "roles"];

    for (const key of arrayKeys) {
      if (Array.isArray(payload[key])) {
        return payload[key] as UserMembership[];
      }
    }

    if (payload.data && typeof payload.data === "object") {
      return normalizeMemberships(payload.data);
    }
  }

  return [];
}

function getRoleLabel(role: unknown) {
  if (typeof role === "string") return role;
  if (Array.isArray(role) && role.length > 0) {
    return role
      .map((item) => item.roleName || item.role?.name || item.name || item.role_name)
      .filter(Boolean)
      .slice(0, 2)
      .join(", ");
  }

  return "";
}

function getDisplayName(value?: string | null, fallback?: string | null) {
  return value?.trim() || fallback?.trim() || "Eventix User";
}

export default function UserProfilePage() {
  const user = useInfo();
  const tokenUser = useMemo(() => getTokenUser(), []);
  const userId = user?.id || tokenUser?.sub || "";
  const canAccessOrgs = useMemo(() => canFetchUserOrganizations(user), [user]);
  const { data: membershipData, loading: membershipLoading } = useOrgsByUser(
    canAccessOrgs ? userId : "",
    { enabled: canAccessOrgs },
  );

  const memberships = useMemo(
    () => (canAccessOrgs ? normalizeMemberships(membershipData) : []),
    [canAccessOrgs, membershipData],
  );
  const permissionCodes = useMemo(() => getUserPermissionCodes(user), [user]);
  const isSuperAdmin = useMemo(() => checkSuperAdmin(permissionCodes), [permissionCodes]);
  const displayName = getDisplayName(user?.fullName, tokenUser?.fullName || tokenUser?.email);
  const email = user?.email || tokenUser?.email || "";
  const roleLabel = isSuperAdmin ? "Super Admin" : getRoleLabel(user?.role) || "Member";
  const accountStatus = user?.isActive === false ? "Inactive" : "Active";

  const quickActions = [
    {
      description: "Open your booked tickets and QR access.",
      href: "/app/tickets",
      icon: Ticket,
      label: "My Tickets",
    },
    {
      description: "Discover events from the Eventix community.",
      href: "/app/events",
      icon: CalendarDays,
      label: "Events",
    },
    {
      description: "Browse organizations and organizer profiles.",
      href: "/app/organizations",
      icon: Building2,
      label: "Organizations",
    },
  ];

  return (
    <div className="user-profilePage">
      <section className="user-profileHero">
        <div className="user-profileHero__identity">
          <img
            className="user-profileHero__avatar"
            src="/logo-event.png"
            alt={`${displayName} profile avatar`}
          />
          <div>
            <p className="user-profileHero__kicker">Eventix Personal Experience</p>
            <h1>{displayName}</h1>
            {email && (
              <p className="user-profileHero__email">
                <Mail size={17} aria-hidden="true" />
                {email}
              </p>
            )}
          </div>
        </div>

        <div className="user-profileHero__side">
          <span className="user-profileHero__status">
            <CheckCircle2 size={16} aria-hidden="true" />
            {accountStatus}
          </span>
          <span className="user-profileHero__status">
            <ShieldCheck size={16} aria-hidden="true" />
            {roleLabel}
          </span>
          <button type="button" className="user-profileHero__edit" disabled>
            Edit profile
          </button>
        </div>
      </section>

      <main className="user-profileMain">
        <section className="user-profilePanel user-profilePanel--info">
          <div className="user-profilePanel__head">
            <span>Personal information</span>
            <h2>Your Eventix identity</h2>
          </div>

          <div className="user-profileInfoGrid">
            <article>
              <UserRound size={18} aria-hidden="true" />
              <span>Full name</span>
              <strong>{displayName}</strong>
            </article>
            <article>
              <Mail size={18} aria-hidden="true" />
              <span>Email</span>
              <strong>{email || "Not public"}</strong>
            </article>
            <article>
              <Phone size={18} aria-hidden="true" />
              <span>Phone</span>
              <strong>{user?.phoneNumber || "Not public"}</strong>
            </article>
            <article>
              <ShieldCheck size={18} aria-hidden="true" />
              <span>Account status</span>
              <strong>{accountStatus}</strong>
            </article>
          </div>
        </section>

        <aside className="user-profilePanel user-profilePanel--account">
          <div className="user-profilePanel__head">
            <span>Account information</span>
            <h2>Access and workspace</h2>
          </div>

          <div className="user-profileAccount">
            <div>
              <span>Role</span>
              <strong>{roleLabel}</strong>
            </div>
            <div>
              <span>Organizations</span>
              <strong>
                {membershipLoading ? "Loading..." : memberships.length.toLocaleString()}
              </strong>
            </div>
            <div>
              <span>User ID</span>
              <strong>{userId || "Not available"}</strong>
            </div>
          </div>
        </aside>

        <section className="user-profilePanel user-profilePanel--actions">
          <div className="user-profilePanel__head">
            <span>Quick action</span>
            <h2>Continue where it matters</h2>
          </div>

          <div className="user-profileActions">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link to={action.href} className="user-profileAction" key={action.label}>
                  <span>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>{action.label}</strong>
                    <small>{action.description}</small>
                  </div>
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="user-profilePanel user-profilePanel--activity">
          <div className="user-profilePanel__head">
            <span>Activity</span>
            <h2>Recent activity</h2>
          </div>

          <div className="user-profileEmpty">
            <CalendarDays size={30} aria-hidden="true" />
            <h3>No activity data yet</h3>
            <p>
              Activity will appear here when Eventix has timeline data for your
              account.
            </p>
            <Link to="/app/events">
              Explore events
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
