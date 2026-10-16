import {
  CalendarClock,
  Mail,
  Search,
  ShieldCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { InvitePopup } from "../../components/admin/invite/InvitePopup";
import Pagination from "../../components/admin/table/Pagination";
import { useOrgBySlug } from "../../hooks/admin/org/useOrgBySlug";
import api from "../../services/api";
import { roleService } from "../../services/admin/role.service";
import "../../styles/admin/table/table.css";
import type { Role } from "../../types/role/role";

type MembershipItem = {
  id: string;
  userId: string;
  createdAt: string;
  userName: string;
  email: string;
  isActive: boolean;
  role: string | null;
};

type MembershipListResult = {
  items: MembershipItem[];
  total: number;
};

function unwrapMembershipItems(value: unknown): MembershipItem[] {
  if (Array.isArray(value)) return value as MembershipItem[];

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const keys = ["items", "members", "memberships", "data"];

    for (const key of keys) {
      const nested = payload[key];
      if (Array.isArray(nested)) return nested as MembershipItem[];
      const result = unwrapMembershipItems(nested);
      if (result.length) return result;
    }
  }

  return [];
}

function getMembershipTotal(value: unknown, fallback: number) {
  if (!value || typeof value !== "object") return fallback;

  const payload = value as Record<string, any>;
  const directTotal =
    payload.total ?? payload.totalItems ?? payload.totalCount ?? payload.count;
  if (typeof directTotal === "number") return directTotal;

  const metaTotal =
    payload.meta?.total ??
    payload.meta?.totalItems ??
    payload.meta?.totalCount ??
    payload.pagination?.total ??
    payload.pagination?.totalItems ??
    payload.pagination?.totalCount;
  if (typeof metaTotal === "number") return metaTotal;

  return getMembershipTotal(payload.data, fallback);
}

function unwrapMembershipList(value: unknown): MembershipListResult {
  const items = unwrapMembershipItems(value);
  return {
    items,
    total: getMembershipTotal(value, items.length),
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return "Pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function unwrapRoleItems(value: unknown): Role[] {
  if (Array.isArray(value)) return value as Role[];

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const keys = ["items", "roles", "data"];

    for (const key of keys) {
      const nested = payload[key];
      if (Array.isArray(nested)) return nested as Role[];
      const result = unwrapRoleItems(nested);
      if (result.length) return result;
    }
  }

  return [];
}

export default function Membership() {
  const { slug } = useParams();
  const { data: currentOrg } = useOrgBySlug(slug || "");
  const [members, setMembers] = useState<MembershipItem[]>([]);
  const [membersTotal, setMembersTotal] = useState(0);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchMemberships = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/membership/org/${slug}`, {
        params: {
          page: page + 1,
          limit: rowsPerPage,
        },
      });
      const nextMembers = unwrapMembershipList(res.data?.data ?? res.data);
      setMembers(nextMembers.items);
      setMembersTotal(nextMembers.total);
    } catch (error) {
      console.error("Fetch organization memberships error:", error);
      setMembers([]);
      setMembersTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, slug]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    let mounted = true;

    const fetchRoles = async () => {
      if (!slug) {
        setRoles([]);
        return;
      }

      try {
        setRolesLoading(true);
        const res = await roleService.getRolesByOrgSlug(slug, { limit: 100 });
        if (mounted) setRoles(unwrapRoleItems(res?.data ?? res));
      } catch (error) {
        console.error("Fetch organization roles error:", error);
        if (mounted) setRoles([]);
      } finally {
        if (mounted) setRolesLoading(false);
      }
    };

    fetchRoles();

    return () => {
      mounted = false;
    };
  }, [slug]);

  const filteredMembers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return members.filter((member) => {
      const status = member.isActive ? "active" : "inactive";
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !keyword ||
        member.userName?.toLowerCase().includes(keyword) ||
        member.email?.toLowerCase().includes(keyword) ||
        member.role?.toLowerCase().includes(keyword);

      return matchesStatus && matchesSearch;
    });
  }, [members, searchTerm, statusFilter]);

  const activeRoleCount = useMemo(() => {
    return new Set(
      members
        .filter((member) => member.isActive && member.role)
        .map((member) => member.role),
    ).size;
  }, [members]);

  const inactiveCount = members.filter((member) => !member.isActive).length;
  const currentOrganizationId =
    currentOrg?.data?.id || currentOrg?.id || currentOrg?.organization?.id || "";

  return (
    <div className="admin-page admin-membership-page">
      <section className="membership-hero">
        <div>
          <span className="membership-eyebrow">
            <UsersRound size={15} aria-hidden="true" />
            Organization workspace
          </span>
          <h2>Membership</h2>
          <p>
            Manage organization members, review roles, and keep invitations in
            one focused workspace.
          </p>
        </div>
        <button
          type="button"
          className="membership-primary-btn"
          onClick={() => setShowInvitePopup(true)}
        >
          <UserPlus size={18} aria-hidden="true" />
          Invite Member
        </button>
      </section>

      <InvitePopup
        isOpen={showInvitePopup}
        mode="organization"
        organizationId={currentOrganizationId}
        roles={roles}
        rolesLoading={rolesLoading}
        eventName="Organization membership"
        onClosePopup={() => setShowInvitePopup(false)}
        onSuccess={fetchMemberships}
      />

      <section className="membership-stats" aria-label="Membership summary">
        <article>
          <UsersRound size={20} aria-hidden="true" />
          <span>Total members</span>
          <strong>{membersTotal}</strong>
        </article>
        <article>
          <ShieldCheck size={20} aria-hidden="true" />
          <span>Active roles</span>
          <strong>{activeRoleCount}</strong>
        </article>
        <article>
          <CalendarClock size={20} aria-hidden="true" />
          <span>Inactive members</span>
          <strong>{inactiveCount}</strong>
        </article>
      </section>

      <section className="membership-panel">
        <div className="membership-toolbar">
          <label className="membership-search">
            <Search size={17} aria-hidden="true" />
            <input
              placeholder="Search member, email, role..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="membership-list">
          {loading && (
            <div className="membership-skeleton" aria-label="Loading memberships">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="membership-row-card membership-row-card--skeleton" key={index}>
                  <span className="membership-skeleton__avatar" />
                  <span className="membership-skeleton__text" />
                  <span className="membership-skeleton__pill" />
                  <span className="membership-skeleton__pill" />
                  <span className="membership-skeleton__date" />
                </div>
              ))}
            </div>
          )}

          {!loading && filteredMembers.length === 0 && (
            <div className="membership-empty">No memberships found.</div>
          )}

          {!loading && filteredMembers.map((member) => (
            <article className="membership-row-card" key={member.id}>
              <div className="membership-avatar">
                {getInitials(member.userName || member.email || "User")}
              </div>
              <div className="membership-member">
                <span className="membership-member__name">
                  {member.userName || "Unknown user"}
                </span>
                <span>
                  <Mail size={14} aria-hidden="true" />
                  {member.email || "No email"}
                </span>
              </div>
              <span className="membership-role">{member.role || "No role"}</span>
              <span
                className={`membership-status membership-status--${
                  member.isActive ? "active" : "inactive"
                }`}
              >
                {member.isActive ? "Active" : "Inactive"}
              </span>
              <span className="membership-date">
                {formatDate(member.createdAt)}
              </span>
            </article>
          ))}
        </div>
        <Pagination
          totalCount={membersTotal}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </section>
    </div>
  );
}
