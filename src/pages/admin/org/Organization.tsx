import "../../../styles/admin/table/table.css";
import "../../../styles/admin/table/btn-action.css";

import AdminSkeleton from "../../../components/admin/skeleton/AdminSkeleton";
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Eye,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { STATUS_STYLES } from "../../../styles/status-styles";
import api from "../../../services/api";
// import component
import { SearchBar } from "../../../components/admin/table/SearchBar";
import Pagination from "../../../components/admin/table/Pagination";
import CustomTable from "../../../components/admin/table/Table";
import type { Column } from "../../../components/admin/table/Table";
import { PopupHideItems } from "../../../components/admin/layout/PopupHideItems";
import ConfirmDialog from "../../../components/admin/layout/DialogConfirm";
//  hook
import { useDataTable } from "../../../hooks/admin/useDataTable";
import { useOrg } from "../../../hooks/admin/org/useOrg";
import { usePageActions } from "../../../hooks/admin/usePageActions";
import type { Organization } from "../../../types/organization/organization";
import { CreateOrgPopup } from "../../../components/admin/org/createOrg";
import { UpdateOrgPopup } from "../../../components/admin/org/updateOrg";
import { orgService } from "../../../services/admin/organization.service";
import { useDelete } from "../../../hooks/admin/org/useDelete";
import { Link, useNavigate } from "react-router-dom";
import { OrgRequestStatus } from "../../../types/enum";
import { toast } from "react-toastify";

type OrganizationMemberItem = {
  id: string;
  userId?: string;
  userName?: string;
  name?: string;
  fullName?: string;
  email?: string;
  status?: string;
  role?: string | null;
  roleName?: string | null;
  user?: {
    id?: string;
    name?: string;
    fullName?: string;
    email?: string;
  };
  roleInfo?: {
    role_name?: string;
    role_code?: string;
    name?: string;
  };
};

type OrganizationMemberListResult = {
  items: OrganizationMemberItem[];
  total: number;
};

const getInitials = (value?: string | null) => {
  if (!value) return "OR";
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const getStatusClass = (status?: string) =>
  `org-status-pill org-status-pill--${(status || "unknown").toLowerCase()}`;

const isOrganizationVerified = (org: Pick<Organization, "isVerified" | "isve">) =>
  Boolean(org.isVerified || org.isve);

const toSlug = (value?: string | null) => {
  if (!value) return "";
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

const getOrganizationSlug = (org: Organization) => {
  const candidate = org as Organization & {
    orgSlug?: string;
    organizationSlug?: string;
    organization?: { slug?: string; name?: string };
    org?: { slug?: string; name?: string };
  };

  const directSlug =
    candidate.slug ||
    candidate.orgSlug ||
    candidate.organizationSlug ||
    candidate.organization?.slug ||
    candidate.org?.slug;

  if (directSlug && typeof directSlug === "string" && directSlug.trim()) {
    return directSlug.trim();
  }

  const name =
    candidate.name ||
    candidate.organization?.name ||
    candidate.org?.name;

  const generatedSlug = toSlug(name);
  if (generatedSlug) {
    return generatedSlug;
  }

  return candidate.id || "";
};

function unwrapOrganizationMemberItems(value: unknown): OrganizationMemberItem[] {
  if (Array.isArray(value)) return value as OrganizationMemberItem[];

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const keys = ["items", "members", "memberships", "data"];

    for (const key of keys) {
      const nested = payload[key];
      if (Array.isArray(nested)) return nested as OrganizationMemberItem[];
      const result = unwrapOrganizationMemberItems(nested);
      if (result.length) return result;
    }
  }

  return [];
}

function getOrganizationMemberTotal(value: unknown, fallback: number) {
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

  return getOrganizationMemberTotal(payload.data, fallback);
}

function unwrapOrganizationMemberList(value: unknown): OrganizationMemberListResult {
  const items = unwrapOrganizationMemberItems(value);
  return {
    items,
    total: getOrganizationMemberTotal(value, items.length),
  };
}

function getOrganizationMemberName(member: OrganizationMemberItem) {
  return (
    member.userName ||
    member.fullName ||
    member.name ||
    member.user?.fullName ||
    member.user?.name ||
    "Unknown user"
  );
}

function getOrganizationMemberEmail(member: OrganizationMemberItem) {
  return member.email || member.user?.email || "No email";
}

function getOrganizationMemberRole(member: OrganizationMemberItem) {
  return (
    member.role ||
    member.roleName ||
    member.roleInfo?.role_name ||
    member.roleInfo?.role_code ||
    member.roleInfo?.name ||
    "No role"
  );
}

function getOrganizationMemberStatus(member: OrganizationMemberItem) {
  return member.status || "Active";
}

export default function Organization() {
  const navigate = useNavigate();
  const [membershipOrg, setMembershipOrg] = useState<Organization | null>(null);
  const [orgMembers, setOrgMembers] = useState<OrganizationMemberItem[]>([]);
  const [orgMembersTotal, setOrgMembersTotal] = useState(0);
  const [orgMembersLoading, setOrgMembersLoading] = useState(false);
  const [orgMembersError, setOrgMembersError] = useState("");
  const [orgMembersPage, setOrgMembersPage] = useState(0);
  const [orgMembersRowsPerPage, setOrgMembersRowsPerPage] = useState(10);
  const [statusUpdatingId, setStatusUpdatingId] = useState("");
  const { data, loading, search, filter, table, pagination, refetch } =
    useDataTable<Organization>({
      fetchHook: useOrg,
    });
  const { deleteSort } = useDelete();

  const {
    popupType,
    setPopupType,
    onFinalDelete,
    isDeleting,
    selectedIds,
    handleCloseAndClear,
    handleOpenConfirm,
    setSelectedIds,
  } = usePageActions(refetch, table, deleteSort);

  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };

  const formatShortDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchOrganizationMembers = useCallback(async () => {
    if (!membershipOrg?.slug) return;

    try {
      setOrgMembersLoading(true);
      setOrgMembersError("");
      const res = await api.get(`/membership/org/${membershipOrg.slug}`, {
        params: {
          page: orgMembersPage + 1,
          limit: orgMembersRowsPerPage,
        },
      });
      const nextMembers = unwrapOrganizationMemberList(res.data?.data ?? res.data);
      setOrgMembers(nextMembers.items);
      setOrgMembersTotal(nextMembers.total);
    } catch (error) {
      console.error("Fetch organization members error:", error);
      setOrgMembers([]);
      setOrgMembersTotal(0);
      setOrgMembersError("Không thể tải danh sách thành viên.");
    } finally {
      setOrgMembersLoading(false);
    }
  }, [membershipOrg?.slug, orgMembersPage, orgMembersRowsPerPage]);

  useEffect(() => {
    if (!membershipOrg) {
      setOrgMembers([]);
      setOrgMembersTotal(0);
      setOrgMembersError("");
      setOrgMembersPage(0);
      return;
    }

    fetchOrganizationMembers();
  }, [fetchOrganizationMembers, membershipOrg]);

  const openMembershipModal = (org: Organization) => {
    const slug = getOrganizationSlug(org);
    const orgWithSlug = { ...org, slug };
    setOrgMembers([]);
    setOrgMembersTotal(org.totalMembers ?? 0);
    setOrgMembersError("");
    setOrgMembersPage(0);
    setMembershipOrg(orgWithSlug);
  };

  const organizations = data.items || [];
  const totalOrganizations = data.total || organizations.length;
  const activeOrganizations = organizations.filter(
    (org) => org.status === OrgRequestStatus.ACTIVE
  ).length;
  const pendingOrganizations = organizations.filter(
    (org) => org.status === OrgRequestStatus.PENDING
  ).length;
  const disabledOrganizations = organizations.filter(
    (org) =>
      org.status === OrgRequestStatus.SUSPENDED ||
      org.status === OrgRequestStatus.ARCHIVED
  ).length;

  const handleApproveOrganization = async (org: Organization) => {
    if (statusUpdatingId) return;

    try {
      setStatusUpdatingId(org.id);
      await orgService.approveOrganization(org.id);
      toast.success("Organization approved");
      refetch?.();
    } finally {
      setStatusUpdatingId("");
    }
  };

  const renderStatusActions = (org: Organization) => {
    const isUpdatingThisOrg = statusUpdatingId === org.id;
    const organizationSlug = getOrganizationSlug(org);
    const organizationDetailRoute = `/admin/organizations/${organizationSlug}`;
    const editButton = (
      <button
        type="button"
        className="org-row-action org-row-action--edit"
        onClick={() => {
          setPopupType("update");
          setSelectedIds([org.id]);
        }}
      >
        <Pencil size={16} aria-hidden="true" />
        <span>Edit</span>
      </button>
    );
    const deleteButton = (
      <button
        type="button"
        className="org-row-action org-row-action--delete"
        onClick={() => {
          setPopupType("confirm");
          setSelectedIds([org.id]);
        }}
      >
        <Trash2 size={16} aria-hidden="true" />
        <span>Delete</span>
      </button>
    );
    const detailButton = (
      <Link
        className="org-row-action org-row-action--detail"
        to={organizationDetailRoute}
        style={{ textDecoration: "none" }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(organizationDetailRoute);
        }}
      >
        <Eye size={16} aria-hidden="true" />
        <span style={{ textDecoration: "none" }}>Detail</span>
      </Link>
    );
    const membersButton = (
      <button
        type="button"
        className="org-row-action org-row-action--members"
        onClick={() => openMembershipModal(org)}
      >
        <UsersRound size={16} aria-hidden="true" />
        <span>Members</span>
      </button>
    );
    const approveButton =
      org.status === OrgRequestStatus.PENDING && !isOrganizationVerified(org) ? (
        <button
          type="button"
          className="org-row-action org-row-action--approve"
          disabled={isUpdatingThisOrg}
          onClick={() => handleApproveOrganization(org)}
        >
          <BadgeCheck size={16} aria-hidden="true" />
          <span>{isUpdatingThisOrg ? "Saving..." : "Approve"}</span>
        </button>
      ) : null;

    if (org.status === OrgRequestStatus.PENDING) {
      return (
        <>
          {editButton}
          {deleteButton}
          {detailButton}
          {membersButton}
          {approveButton}
        </>
      );
    }

    if (org.status === OrgRequestStatus.ACTIVE) {
      return (
        <>
          {editButton}
          {deleteButton}
          {detailButton}
          {membersButton}
        </>
      );
    }

    if (org.status === OrgRequestStatus.SUSPENDED) {
      return (
        <>
          {detailButton}
          {membersButton}
        </>
      );
    }

    return detailButton;
  };

  // setup column
  const orgColumns: Column<Organization>[] = [
    {
      id: "name",
      label: "Organization",
      render: (org: Organization) => (
        <div className="org-admin-cell">
          <span className="org-admin-avatar">{getInitials(org.name)}</span>
          <div>
            <strong>{org.name}</strong>
            <small>{getOrganizationSlug(org)}</small>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      id: "owner",
      label: "Owner",
      render: (org: Organization) => {
        return (
          <div className="org-owner-cell">
            <strong>{org.owner?.fullName || "No owner"}</strong>
            <span>{org.owner?.email || "No owner email"}</span>
          </div>
        );
      },
      sortable: false,
    },
    {
      id: "createdAt",
      label: "Created date",
      render: (org: Organization) => {
        return (
          <span className="org-date-cell">
            <CalendarDays size={15} aria-hidden="true" />
            {formatShortDate(org.createdAt)}
          </span>
        );
      },
      sortable: false,
    },
    {
      id: "status",
      label: "Organization status",
      render: (org: Organization) => {
        const style = STATUS_STYLES[org.status] || STATUS_STYLES.SPAM;
        return (
          <div className="org-status-stack">
            <span
              className={getStatusClass(org.status)}
              style={{
                background: style.bg,
                color: style.text,
                border: `1px solid ${style.border}`,
              }}
            >
              {org.status}
            </span>
          </div>
        );
      },
      sortable: false,
    },
    {
      id: "isVerified",
      label: "Verification",
      render: (org: Organization) => (
        <div className="org-verification-cell">
          {isOrganizationVerified(org) ? (
            <span className="org-status-pill org-status-pill--verified">
              <BadgeCheck size={14} aria-hidden="true" />
              Verified
            </span>
          ) : (
            <span className="org-verification-chip org-verification-chip--muted">
              Not verified
            </span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      id: "actions",
      label: "Actions",
      render: (org) => (
        <div className="org-row-actions">{renderStatusActions(org)}</div>
      ),
      sortable: false,
    },
  ];
  return (
    <div className="admin-page admin-page--organizations">
      <ConfirmDialog
        open={popupType === "confirm"}
        onConfirm={() => onFinalDelete()}
        onClose={() => setPopupType(null)}
        loading={isDeleting}
      />
      <PopupHideItems
        title="Delete"
        count={table.selected.length}
        show={table.selected.length > 0}
        onConfirm={() => handleOpenConfirm(table.selected.map(String))}
        onClose={() => handleCloseAndClear()}
      />
      {membershipOrg && (
        <div
          className="org-membership-overlay"
          role="presentation"
          onClick={() => setMembershipOrg(null)}
        >
          <section
            className="org-membership-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${membershipOrg.name} membership summary`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="org-membership-modal__header">
              <div>
                <span>Organization Membership</span>
                <h3>{membershipOrg.name}</h3>
              </div>
              <button
                type="button"
                aria-label="Close membership popup"
                onClick={() => setMembershipOrg(null)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            <div className="org-membership-modal__metric">
              <UsersRound size={20} aria-hidden="true" />
              <div>
                <span>Total members</span>
                <strong>{orgMembersTotal}</strong>
              </div>
            </div>

            <div className="org-membership-modal__list">
              {orgMembersLoading && (
                <div className="membership-empty">Loading members...</div>
              )}
              {!orgMembersLoading && orgMembersError && (
                <div className="membership-empty">{orgMembersError}</div>
              )}
              {!orgMembersLoading && !orgMembersError && orgMembers.length === 0 && (
                <div className="membership-empty">No members found.</div>
              )}
              {!orgMembersLoading && !orgMembersError && orgMembers.map((member) => (
                <div className="org-membership-modal__row" key={member.id || member.userId}>
                  <div className="membership-avatar">
                    {getInitials(getOrganizationMemberName(member))}
                  </div>
                  <div className="membership-member">
                    <span className="membership-member__name">
                      {getOrganizationMemberName(member)}
                    </span>
                    <span>
                      <Mail size={14} aria-hidden="true" />
                      {getOrganizationMemberEmail(member)}
                    </span>
                  </div>
                  <span className="membership-role">{getOrganizationMemberRole(member)}</span>
                  <span className="membership-status membership-status--active">
                    {getOrganizationMemberStatus(member)}
                  </span>
                </div>
              ))}
            </div>
            <Pagination
              totalCount={orgMembersTotal}
              page={orgMembersPage}
              rowsPerPage={orgMembersRowsPerPage}
              onPageChange={(_, newPage) => setOrgMembersPage(newPage)}
              onRowsPerPageChange={(event) => {
                setOrgMembersRowsPerPage(parseInt(event.target.value, 10));
                setOrgMembersPage(0);
              }}
            />

            <footer className="org-membership-modal__footer">
              <span>Status: {membershipOrg.status}</span>
              <span>Created: {formatShortDate(membershipOrg.createdAt)}</span>
            </footer>
          </section>
        </div>
      )}
      {popupType === "create" && (
        <CreateOrgPopup
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      {popupType === "update" && (
        <UpdateOrgPopup
          id={selectedIds.length === 1 ? selectedIds[0] : ""}
          onSuccess={() => refetch?.()}
          onClose={() => setPopupType(null)}
        />
      )}
      <section className="org-admin-hero">
        <div className="org-admin-hero__copy">
          <span className="org-admin-eyebrow">
            <Building2 size={16} aria-hidden="true" />
            Organization Control
          </span>
          <h1>Organization Management</h1>
          <p>
            Theo dõi tổ chức, trạng thái vận hành, owner và quyền truy cập trong
            một màn hình gọn hơn.
          </p>
        </div>
        <button
          type="button"
          className="org-admin-primary-action"
          onClick={() => setPopupType("create")}
        >
          <Plus size={18} aria-hidden="true" />
          Create organization
        </button>
      </section>

      <section className="org-admin-summary" aria-label="Organization summary">
        <article>
          <span className="org-summary-icon">
            <Building2 size={18} aria-hidden="true" />
          </span>
          <small>Total organizations</small>
          <strong>{totalOrganizations}</strong>
        </article>
        <article>
          <span className="org-summary-icon org-summary-icon--success">
            <BadgeCheck size={18} aria-hidden="true" />
          </span>
          <small>Active status</small>
          <strong>{activeOrganizations}</strong>
        </article>
        <article>
          <span className="org-summary-icon org-summary-icon--warning">
            <ShieldCheck size={18} aria-hidden="true" />
          </span>
          <small>Pending review</small>
          <strong>{pendingOrganizations}</strong>
        </article>
        <article>
          <span className="org-summary-icon org-summary-icon--muted">
            <X size={18} aria-hidden="true" />
          </span>
          <small>Suspended / archived</small>
          <strong>{disabledOrganizations}</strong>
        </article>
      </section>

      <section className="org-admin-panel">
        <div className="org-admin-panel__header">
          <div>
            <span>Directory</span>
            <h2>Organization list</h2>
          </div>
        </div>
        <SearchBar
          onSearchChange={onSearchChange}
          placeholder={["Name", " Email", " Owner"]}
          onCreate={() => {
            setPopupType("create");
          }}
          title="organization"
          filters={[
            {
              key: "status",
              placeholder: "Organization status",
              options: [
                { label: "Pending", value: "PENDING" },
                { label: "Active", value: "ACTIVE" },
                { label: "Suspended", value: "SUSPENDED" },
                { label: "Archived", value: "ARCHIVED" },
                { label: "Rejected", value: "REJECTED" },
              ],
            },
          ]}
          onFilterChange={filter.handleFilterChange}
        />
      </section>
      {loading ? (
        <AdminSkeleton variant="table" rows={6} />
      ) : organizations.length === 0 ? (
        <section className="org-admin-empty">
          <span>
            <Building2 size={28} aria-hidden="true" />
          </span>
          <h3>No organizations found</h3>
          <p>Không có tổ chức nào khớp với tìm kiếm hoặc bộ lọc hiện tại.</p>
          <button type="button" onClick={() => setPopupType("create")}>
            <Plus size={17} aria-hidden="true" />
            Create organization
          </button>
        </section>
      ) : (
        <>
          <div className="org-admin-table admin-table-shell">
            <CustomTable
              rows={organizations}
              columns={orgColumns}
              tableClassName="org-table-container"
              order={table.sortOrder}
              orderBy={table.sortBy}
              onSort={table.handleSort}
              selected={table.selected}
              onSelectOne={table.handleSelectOne}
              onSelectAll={(checked) => table.handleSelectAll(checked, organizations)}
            />
          </div>
          <div className="org-admin-mobile-list" aria-label="Organization mobile list">
            {organizations.map((org) => {
              const style = STATUS_STYLES[org.status] || STATUS_STYLES.SPAM;
              const verified = isOrganizationVerified(org);
              return (
                <article className="org-admin-mobile-card" key={org.id}>
                  <div className="org-admin-mobile-card__top">
                    <div className="org-admin-cell">
                      <span className="org-admin-avatar">
                        {getInitials(org.name)}
                      </span>
                      <div>
                        <strong>{org.name}</strong>
                        <small>{getOrganizationSlug(org)}</small>
                      </div>
                    </div>
                    <span
                      className={getStatusClass(org.status)}
                      style={{
                        background: style.bg,
                        color: style.text,
                        border: `1px solid ${style.border}`,
                      }}
                    >
                      {org.status}
                    </span>
                  </div>
                  <div className="org-admin-mobile-card__meta">
                    <span>{org.owner?.fullName || "No owner"}</span>
                    <span>{formatShortDate(org.createdAt)}</span>
                  </div>
                  <div className="org-admin-mobile-card__active">
                    <span>Verification</span>
                    {verified ? (
                      <span className="org-status-pill org-status-pill--verified">
                        <BadgeCheck size={14} aria-hidden="true" />
                        Verified
                      </span>
                    ) : (
                      <span className="org-verification-chip org-verification-chip--muted">
                        Not verified
                      </span>
                    )}
                  </div>
                  <div className="org-row-actions">{renderStatusActions(org)}</div>
                </article>
              );
            })}
          </div>
          <Pagination
            totalCount={data.total || 0}
            page={pagination.page}
            onPageChange={(_, newPage) => pagination.setPage(newPage)}
            rowsPerPage={pagination.rowsPerPage}
            onRowsPerPageChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              pagination.setRowsPerPage(newLimit);
              pagination.setPage(0);
            }}
          />
        </>
      )}
    </div>
  );
}
