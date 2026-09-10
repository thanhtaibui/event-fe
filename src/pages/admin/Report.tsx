import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import "../../styles/admin/table/btn-action.css";
import "../../styles/admin/table/table.css";
import Pagination from "../../components/admin/table/Pagination";
import { PopupHideItems } from "../../components/admin/layout/PopupHideItems";
import { SearchBar } from "../../components/admin/table/SearchBar";
import CustomTable, { type Column } from "../../components/admin/table/Table";
import AdminSkeleton from "../../components/admin/skeleton/AdminSkeleton";
import { UseReport } from "../../hooks/admin/report/useReport";
import { UseOrgReport } from "../../hooks/org/report/useReport";
import { useDataTable } from "../../hooks/admin/useDataTable";
import type { Report } from "../../types/report/report";
import { STATUS_STYLES } from "../../styles/status-styles";
import { OrgRequestStatus, ReportStatus, type ReportStatus as ReportStatusType } from "../../types/enum";
import { reportService } from "../../services/admin/report.service";
import { orgService } from "../../services/admin/organization.service";
import { useInfo } from "../../hooks/layout/useInfo";
import {
  getUserPermissionCodes,
  isSuperAdmin as checkSuperAdmin,
} from "../../config/adminPermissionConfig";
import { triggerNotification } from "../../hooks/notification/useNotificationTrigger";

const REPORT_STATUS_OPTIONS = [
  { label: "Pending", value: ReportStatus.PENDING },
  { label: "Processing", value: ReportStatus.PROCESSING },
  { label: "Resolved", value: ReportStatus.RESOLVED },
  { label: "Rejected", value: ReportStatus.REJECTED },
  { label: "Spam", value: ReportStatus.SPAM },
];

const ORG_STATUS_OPTIONS = [
  { label: "Keep organization unchanged", value: "" },
  { label: "Suspend organization", value: OrgRequestStatus.SUSPENDED },
];

const getStatusKey = (status?: string) => status?.trim().toUpperCase() || "PENDING";

const getStatusLabel = (status?: string) => status?.trim().toLowerCase() || "pending";

export default function Report() {
  const { slug } = useParams();
  const isOrgWorkspace = Boolean(slug);
  const currentUser = useInfo();
  const canModerateReport = useMemo(
    () => !isOrgWorkspace && checkSuperAdmin(getUserPermissionCodes(currentUser)),
    [currentUser, isOrgWorkspace],
  );
  const { data, loading, search, filter, table, pagination, refetch } = useDataTable<Report>({
    fetchHook: (query) =>
      isOrgWorkspace ? UseOrgReport(slug || "", query) : UseReport(query),
  });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [nextReportStatus, setNextReportStatus] = useState<ReportStatusType>(ReportStatus.PROCESSING);
  const [nextOrgStatus, setNextOrgStatus] = useState<OrgRequestStatus | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canSuspendOrganization = nextReportStatus === ReportStatus.RESOLVED;

  const statusSummary = useMemo(() => {
    const counts = data.items.reduce(
      (acc, report) => {
        const key = getStatusKey(report.status);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return REPORT_STATUS_OPTIONS.map((item) => ({
      ...item,
      count: counts[getStatusKey(item.value)] || 0,
    }));
  }, [data.items]);

  const openReviewPopup = (report: Report) => {
    setSelectedReport(report);
    setNextReportStatus(report.status || ReportStatus.PROCESSING);
    setNextOrgStatus("");
  };

  const closeReviewPopup = () => {
    if (isSubmitting) return;
    setSelectedReport(null);
    setNextOrgStatus("");
  };

  const handleBulkSpam = async () => {
    if (!canModerateReport) return;
    if (table.selected.length === 0) return;
    setIsSubmitting(true);
    try {
      await Promise.all(
        table.selected.map((id) =>
          reportService.updateStatus(
            String(id),
            ReportStatus.SPAM,
          )
        )
      );
      await triggerNotification("REPORT_BULK_SPAM", { count: table.selected.length });
      toast.success("Marked selected reports as spam");
      table.handleSelectAll(false, []);
      refetch?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!canModerateReport) return;
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      await reportService.updateStatus(
        selectedReport.id,
        nextReportStatus,
      );
      if (canSuspendOrganization && nextOrgStatus && selectedReport.organization?.id) {
        await orgService.updateStatus(selectedReport.organization.id, nextOrgStatus);
      }
      await triggerNotification("REPORT_REVIEWED", {
        orgName: selectedReport.organization?.name,
        status: nextReportStatus,
      });
      toast.success("Report reviewed successfully");
      setSelectedReport(null);
      setNextOrgStatus("");
      refetch?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseAndClear = () => {
    table.handleSelectAll(false, []);
  };
  const onSearchChange = (val: string) => {
    search.handleSearchChange(val);
  };
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);

    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const reportColumns: Column<Report>[] = [
    {
      id: "user",
      label: "User Name",
      render: (row) => (
        <div className="report-user-cell">
          <strong>{row.user?.fullName || "Unknown user"}</strong>
          <span>{row.user?.email || "No email"}</span>
        </div>
      ),
      sortable: false,
    },
    {
      id: "organization",
      label: "Organization Name",
      render: (row) => (
        <div className="report-org-cell">
          <strong>{row.organization?.name || "Unknown organization"}</strong>
          {row.organization?.status && (
            <span>{row.organization.status}</span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      id: "status",
      label: "Status",
      render: (row: Report) => {
        const statusKey = getStatusKey(row.status);
        const styleStatus =
          STATUS_STYLES[statusKey] || STATUS_STYLES["PENDING"];
        return (
          <span
            className="role-badge"
            style={{
              background: styleStatus.bg,
              color: styleStatus.text,
              border: `1px solid ${styleStatus.border}`,
            }}
          >
            {getStatusLabel(row.status)}
          </span>
        );
      },
      sortable: false,
    },
    {
      id: "reason",
      label: "Reason",
      render: (row) => <span className="report-reason-cell">{row.reason}</span>,
      sortable: false,
    },
    {
      id: "createAt",
      label: "Create date",
      sortable: false,
      render: (row: Report) => formatDate(row.createAt.toString()),
    },
    {
      id: "actions",
      label: "Actions",
      render: (row) => (
        <button className="btn-detail report-review-btn" onClick={() => openReviewPopup(row)}>
          <img
            width="18"
            height="18"
            className="icon-white"
            src="https://img.icons8.com/nolan/64/fine-print.png"
            alt="review"
          />
          <span className="text-detail">{canModerateReport ? "Review" : "View"}</span>
        </button>
      ),
      sortable: false,
    },
  ];
  return (
    <div className="admin-page report">
      <PopupHideItems
        title="Spam"
        count={table.selected.length}
        show={canModerateReport && table.selected.length > 0}
        onConfirm={handleBulkSpam}
        onClose={() => handleCloseAndClear()}
      />

      {selectedReport && (
        <div className="report-modal-overlay" role="presentation">
          <div className="report-review-modal" role="dialog" aria-modal="true">
            <div className="report-review-modal__header">
              <div>
                <span className="report-modal-eyebrow">Report review</span>
                <h2>{canModerateReport ? "Review organization report" : "Report details"}</h2>
                <p>
                  {canModerateReport
                    ? "Review the report details, update its moderation status, and warn the organization when needed."
                    : "This organization workspace can only view what users reported. Status changes are handled by Super Admin."}
                </p>
              </div>
              <button className="report-modal-close" onClick={closeReviewPopup} disabled={isSubmitting}>
                ×
              </button>
            </div>

            <div className="report-review-modal__body">
              <section className="report-detail-card">
                <span className="report-detail-card__label">Reporter</span>
                <strong>{selectedReport.user?.fullName || "Unknown user"}</strong>
                <p>{selectedReport.user?.email || "No email"}</p>
              </section>

              <section className="report-detail-card">
                <span className="report-detail-card__label">Reported organization</span>
                <strong>{selectedReport.organization?.name || "Unknown organization"}</strong>
              </section>

              <section className="report-detail-card">
                <span className="report-detail-card__label">Current status</span>
                <strong className="report-current-status">{getStatusLabel(selectedReport.status)}</strong>
              </section>

              <section className="report-detail-card report-detail-card--wide">
                <span className="report-detail-card__label">Report reason</span>
                <p className="report-detail-reason">{selectedReport.reason || "No reason provided"}</p>
              </section>

              {canModerateReport ? (
                <>
                  <label className="report-review-field">
                    <span>Report status</span>
                    <select
                      value={nextReportStatus}
                      onChange={(e) => {
                        const status = e.target.value as ReportStatusType;
                        setNextReportStatus(status);
                        if (status !== ReportStatus.RESOLVED) {
                          setNextOrgStatus("");
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      {REPORT_STATUS_OPTIONS.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="report-review-field">
                    <span>Organization action</span>
                    <select
                      value={nextOrgStatus}
                      onChange={(e) => setNextOrgStatus(e.target.value as OrgRequestStatus | "")}
                      disabled={isSubmitting || !canSuspendOrganization}
                    >
                      {ORG_STATUS_OPTIONS.map((status) => (
                        <option key={status.value || "none"} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    {!canSuspendOrganization && (
                      <small className="report-review-help">
                        Organization can only be suspended after the report is resolved.
                      </small>
                    )}
                  </label>
                </>
              ) : (
                <section className="report-detail-card report-detail-card--wide report-readonly-note">
                  <span className="report-detail-card__label">Read only</span>
                  <p>
                    Organization admins can review the report content only. Please wait for Super Admin moderation.
                  </p>
                </section>
              )}
            </div>

            <div className="report-review-modal__footer">
              <button className="report-btn report-btn--ghost" onClick={closeReviewPopup} disabled={isSubmitting}>
                {canModerateReport ? "Cancel" : "Close"}
              </button>
              {canModerateReport && (
                <button className="report-btn report-btn--primary" onClick={handleReviewSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save review"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="report-overview">
        <div className="report-overview__copy">
          <span>Moderation center</span>
          <h1>Reports</h1>
          <p>
            {canModerateReport
              ? "Super Admin can review user reports, update moderation status, and suspend organizations when needed."
              : "Organization workspace can view report details only. Moderation status is controlled by Super Admin."}
          </p>
        </div>
        <div className="report-overview__stats">
          {statusSummary.map((status) => {
            const style = STATUS_STYLES[getStatusKey(status.value)] || STATUS_STYLES.PENDING;
            return (
              <div className="report-stat-card" key={status.value}>
                <span style={{ color: style.text }}>{status.label}</span>
                <strong>{status.count}</strong>
              </div>
            );
          })}
        </div>
      </section>

      <SearchBar
        onSearchChange={onSearchChange}
        title="report"
        placeholder={["user", " organization", " reason"]}
        filters={[
          {
            key: "status",
            placeholder: "Status",
            options: REPORT_STATUS_OPTIONS,
          },
        ]}
        onFilterChange={filter.handleFilterChange}
      />

      {loading ? (
        <AdminSkeleton variant="table" rows={7} />
      ) : (
        <>
          <CustomTable
            rows={data.items}
            columns={reportColumns}
            order={table.sortOrder}
            orderBy={table.sortBy}
            onSort={table.handleSort}
            selected={table.selected}
            onSelectOne={table.handleSelectOne}
            onSelectAll={(checked) =>
              table.handleSelectAll(checked, data.items || [])
            }
          />
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
