import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileCheck2,
  FileText,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import AdminSkeleton from "../../../components/admin/skeleton/AdminSkeleton";
import { orgVerificationService } from "../../../services/admin/org-verification.service";
import { useOrgVerification } from "../../../hooks/admin/orgVerification/useOrgVerification";
import type {
  OrgVerificationRequest,
  OrgVerificationStatus,
} from "../../../types/organization/verification";
import { triggerNotification } from "../../../hooks/notification/useNotificationTrigger";
import "../../../styles/admin/org-verification.css";

const REVIEW_STATUS_OPTIONS: Array<{
  label: string;
  value: Exclude<OrgVerificationStatus, "PENDING">;
  description: string;
  icon: typeof ShieldCheck;
  color: "approved" | "processing" | "rejected";
  disabled?: boolean;
  badge?: string;
}> = [
  {
    label: "Approve verification",
    value: "APPROVED",
    description: "Grant verified status and official verified badge",
    icon: ShieldCheck,
    color: "approved",
  },
  {
    label: "Request more review",
    value: "PROCESSING",
    description: "Mark for additional inspection (BE pending)",
    icon: Clock,
    color: "processing",
    disabled: true,
    badge: "Readonly",
  },
  {
    label: "Reject request",
    value: "REJECTED",
    description: "Decline verification request with internal reason",
    icon: ShieldAlert,
    color: "rejected",
  },
];

function getOrgName(request: OrgVerificationRequest) {
  return request.organization?.name || "Unknown organization";
}

function getTaxNumber(request: OrgVerificationRequest) {
  return request.taxIdNumber || request.taxNumber || "-";
}

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusClass(status?: string) {
  return `verification-status verification-status--${(status || "PENDING").toLowerCase()}`;
}

export default function OrgVerification() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<OrgVerificationRequest | null>(null);
  const [reviewStatus, setReviewStatus] =
    useState<Exclude<OrgVerificationStatus, "PENDING">>("APPROVED");
  const [reviewerNote, setReviewerNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copiedTax, setCopiedTax] = useState(false);
  const [refreshingDoc, setRefreshingDoc] = useState(false);
  const [docLoadError, setDocLoadError] = useState(false);

  const apiQuery = useMemo(
    () => ({
      page: 1,
      limit: 20,
      search: query.trim(),
      ...(status ? { "filter.status": `$eq:${status}` } : {}),
    }),
    [query, status],
  );

  const { data, loading, fetchData } = useOrgVerification(apiQuery);

  const openReview = (request: OrgVerificationRequest) => {
    setSelected(request);
    setReviewStatus(request.status === "PROCESSING" ? "PROCESSING" : "APPROVED");
    setReviewerNote(request.reviewerNote || "");
    setCopiedTax(false);
    setDocLoadError(false);
  };

  const closeReview = () => {
    setSelected(null);
    setReviewerNote("");
    setReviewStatus("APPROVED");
    setCopiedTax(false);
    setDocLoadError(false);
  };

  const handleRefreshDocUrl = async (id: string) => {
    try {
      setRefreshingDoc(true);
      const res = await orgVerificationService.getById(id);
      const item = res?.data ?? res;
      const freshUrl = item?.documentUrl;
      if (freshUrl) {
        setSelected((prev) =>
          prev && prev.id === id ? { ...prev, documentUrl: freshUrl } : prev,
        );
        setDocLoadError(false);
        toast.success("Document signed URL refreshed");
      } else {
        toast.warn("Server did not return a refreshed document URL");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to refresh document URL");
    } finally {
      setRefreshingDoc(false);
    }
  };

  const handleCopyTax = (taxNumber: string) => {
    if (!taxNumber || taxNumber === "-") return;
    navigator.clipboard.writeText(taxNumber);
    setCopiedTax(true);
    toast.success("Tax number copied to clipboard");
    setTimeout(() => setCopiedTax(false), 2000);
  };

  const handleReview = async () => {
    if (!selected) return;

    try {
      setSubmitting(true);
      await orgVerificationService.update(selected.id, {
        status: reviewStatus,
        reviewerNote: reviewerNote.trim() || undefined,
      });
      await triggerNotification("ORG_VERIFICATION_REVIEWED", {
        orgName: getOrgName(selected),
        status: reviewStatus,
      });
      toast.success("Verification request updated");
      closeReview();
      fetchData();
    } finally {
      setSubmitting(false);
    }
  };

  const totalPending = data.items.filter(
    (item) => (item.status || "PENDING") === "PENDING",
  ).length;

  const isImageDoc = Boolean(
    selected?.documentUrl &&
      /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(selected.documentUrl),
  );

  return (
    <div className="verification-page">
      <section className="verification-hero">
        <div>
          <span className="verification-eyebrow">
            <ShieldCheck size={16} aria-hidden="true" />
            Business verification
          </span>
          <h1>Organization verification requests</h1>
          <p>
            Review legal documents, tax numbers, and approve trusted
            organizations before showing the verified badge.
          </p>
        </div>
        <div className="verification-hero__metric">
          <span>Pending review</span>
          <strong>{totalPending}</strong>
        </div>
      </section>

      <section className="verification-toolbar">
        <label className="verification-search">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search organization, owner, tax number..."
          />
        </label>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter verification status"
        >
          <option value="">All status</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </section>

      {loading ? (
        <AdminSkeleton variant="table" rows={6} />
      ) : (
        <section className="verification-table">
          <div className="verification-table__head">
            <span>Organization</span>
            <span>Tax number</span>
            <span>Document</span>
            <span>Status</span>
            <span>Submitted</span>
            <span>Action</span>
          </div>

          {data.items.length === 0 ? (
            <div className="verification-empty">
              <FileCheck2 size={28} aria-hidden="true" />
              <p>No verification requests found.</p>
            </div>
          ) : (
            data.items.map((request) => (
              <article className="verification-row" key={request.id}>
                <div className="verification-org-cell">
                  <span className="verification-avatar">
                    {getOrgName(request).charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <strong>{getOrgName(request)}</strong>
                    <small>{request.organization?.owner?.email || "No owner email"}</small>
                  </div>
                </div>
                <span className="verification-tax">{getTaxNumber(request)}</span>
                <a
                  className="verification-document"
                  href={request.documentUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!request.documentUrl}
                >
                  Document
                  <ExternalLink size={14} aria-hidden="true" />
                </a>
                <span className={statusClass(request.status)}>
                  {request.status || "PENDING"}
                </span>
                <span className="verification-date">
                  {formatDate(request.createdAt)}
                </span>
                <button
                  type="button"
                  className="verification-review-btn"
                  onClick={() => openReview(request)}
                  title="Review verification request"
                >
                  <Eye size={15} aria-hidden="true" />
                  <span>Review</span>
                </button>
              </article>
            ))
          )}
        </section>
      )}

      {selected && (
        <div className="verification-modal-overlay" onClick={closeReview}>
          <section
            className="verification-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="verification-review-title"
            onClick={(event) => event.stopPropagation()}
          >
            {/* Header */}
            <header className="verification-modal__header">
              <div className="verification-modal__title-group">
                <div className="verification-modal__eyebrow">
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>Verification Dossier</span>
                  <span className={statusClass(selected.status)}>
                    {selected.status || "PENDING"}
                  </span>
                </div>
                <div className="verification-modal__org-info">
                  <span className="verification-avatar verification-avatar--modal">
                    {getOrgName(selected).charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <h2 id="verification-review-title">{getOrgName(selected)}</h2>
                    <p className="verification-modal__sub">
                      {selected.organization?.owner?.email || "No owner email"} • Submitted {formatDate(selected.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="verification-modal__close"
                aria-label="Close review modal"
                onClick={closeReview}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </header>

            {/* Body: 2-Column Responsive Dossier + Full Width Bottom Audit Note */}
            <div className="verification-modal__body">
              {/* Top Grid: Left (Tax & Doc), Right (Checklist & Decision) */}
              <div className="verification-modal__grid">
                {/* Left Column: Số thuế và ảnh */}
                <div className="verification-modal__col">
                  {/* Tax ID Number Card */}
                  {/* Tax ID Number Card - Inline compact */}
                  <div className="verification-card verification-card--tax">
                    <div className="verification-tax-line">
                      <span className="verification-tax-label">TAX ID:</span>
                      <code className="verification-tax-code">{getTaxNumber(selected)}</code>
                      <button
                        type="button"
                        className="verification-copy-btn"
                        onClick={() => handleCopyTax(getTaxNumber(selected))}
                        title="Copy tax number"
                      >
                        {copiedTax ? (
                          <>
                            <Check size={13} aria-hidden="true" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} aria-hidden="true" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submitted Document Proof */}
                  <div className="verification-card verification-card--doc">
                    <div className="verification-card-title">
                      <FileCheck2 size={14} aria-hidden="true" />
                      <span>Submitted Legal Document</span>
                    </div>
                    {selected.documentUrl ? (
                      <div className="verification-doc-box">
                        {isImageDoc && !docLoadError && (
                          <div className="verification-doc-thumb">
                            <img
                              src={selected.documentUrl}
                              alt="Document preview"
                              onError={() => setDocLoadError(true)}
                            />
                          </div>
                        )}
                        {docLoadError && (
                          <div
                            className="verification-doc-empty"
                            style={{
                              borderColor: "#f59e0b",
                              background: "#fffbeb",
                              color: "#b45309",
                            }}
                          >
                            <FileText size={16} aria-hidden="true" />
                            <span>
                              Document URL might have expired (valid for 5 mins). Click &ldquo;Refresh&rdquo; below to renew.
                            </span>
                          </div>
                        )}
                        <div className="verification-doc-meta">
                          <span
                            className="verification-doc-name"
                            title={selected.documentUrl}
                          >
                            {selected.documentUrl.split("?")[0].split("/").pop() ||
                              "Verification document"}
                          </span>
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            <button
                              type="button"
                              className="verification-copy-btn"
                              onClick={() => handleRefreshDocUrl(selected.id)}
                              disabled={refreshingDoc}
                              title="Refresh temporary document URL"
                            >
                              <RefreshCw
                                size={12}
                                className={refreshingDoc ? "animate-spin" : ""}
                                aria-hidden="true"
                              />
                              <span>{refreshingDoc ? "Refreshing..." : "Refresh"}</span>
                            </button>
                            <a
                              className="verification-doc-open-btn"
                              href={selected.documentUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink size={13} aria-hidden="true" />
                              <span>Open</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="verification-doc-empty">
                        <FileText size={18} aria-hidden="true" />
                        <span>No document URL provided</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Checklist & Review Decision */}
                <div className="verification-modal__col">
                  {/* Verification Criteria Checklist */}
                  <div className="verification-card verification-card--checklist">
                    <div className="verification-card-title">
                      <ShieldCheck size={14} aria-hidden="true" />
                      <span>Verification Criteria</span>
                    </div>

                    <div className="verification-checklist-simple">
                      <div className="verification-checklist-simple-item">
                        <CheckCircle2 size={14} className="checklist-icon--required" aria-hidden="true" />
                        <span>
                          <strong>Business License / Registration (MST)</strong>
                          <em className="tag-required">Mandatory</em>
                        </span>
                      </div>
                      <div className="verification-checklist-simple-item">
                        <CheckCircle2 size={14} className="checklist-icon--optional" aria-hidden="true" />
                        <span>
                          <strong>Sub-licenses & Legal Rep ID</strong>
                          <em className="tag-optional">Optional</em>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Review Decision */}
                  <div className="verification-card verification-card--decision">
                    <div className="verification-card-title">
                      <BadgeCheck size={14} aria-hidden="true" />
                      <span>Review Decision</span>
                    </div>
                    <div className="verification-decision-cards" role="radiogroup" aria-label="Review decision">
                      {REVIEW_STATUS_OPTIONS.map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = reviewStatus === item.value;
                        const isDisabled = Boolean(item.disabled);
                        return (
                          <div
                            key={item.value}
                            role="radio"
                            aria-checked={isSelected}
                            aria-disabled={isDisabled}
                            tabIndex={isDisabled ? -1 : 0}
                            className={`verification-decision-option verification-decision-option--${item.color} ${
                              isSelected ? "is-selected" : ""
                            } ${isDisabled ? "is-disabled" : ""}`}
                            onClick={() => {
                              if (!isDisabled) setReviewStatus(item.value);
                            }}
                            onKeyDown={(e) => {
                              if (!isDisabled && (e.key === " " || e.key === "Enter")) {
                                e.preventDefault();
                                setReviewStatus(item.value);
                              }
                            }}
                          >
                            <div className="verification-decision-option__icon">
                              <IconComponent size={16} aria-hidden="true" />
                            </div>
                            <div className="verification-decision-option__content">
                              <div className="verification-decision-option__title-row">
                                <strong>{item.label}</strong>
                                {item.badge && (
                                  <span className="verification-decision-badge">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <small>{item.description}</small>
                            </div>
                            <div className="verification-decision-option__check">
                              <div className="verification-radio-dot" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Internal Audit Note (Full Width) */}
              <div className="verification-card verification-card--note">
                <label className="verification-card-title" htmlFor="verification-reviewer-note">
                  <FileText size={14} aria-hidden="true" />
                  <span>Internal Audit Note</span>
                </label>
                <textarea
                  id="verification-reviewer-note"
                  value={reviewerNote}
                  onChange={(event) => setReviewerNote(event.target.value)}
                  placeholder="Enter review notes, findings, reason for approval or rejection..."
                  rows={4}
                />
              </div>
            </div>

            {/* Footer */}
            <footer className="verification-modal__footer">
              <button
                type="button"
                className="verification-btn verification-btn--ghost"
                onClick={closeReview}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`verification-btn verification-btn--primary verification-btn--${reviewStatus.toLowerCase()}`}
                onClick={handleReview}
                disabled={submitting}
              >
                <BadgeCheck size={17} aria-hidden="true" />
                <span>
                  {submitting
                    ? "Saving decision..."
                    : `Confirm ${
                        reviewStatus === "APPROVED"
                          ? "Approval"
                          : reviewStatus === "REJECTED"
                            ? "Rejection"
                            : "Update"
                      }`}
                </span>
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
