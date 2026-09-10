import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  ExternalLink,
  FileCheck2,
  Search,
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

const REVIEW_STATUSES: Array<{
  label: string;
  value: Exclude<OrgVerificationStatus, "PENDING">;
}> = [
  { label: "Approve verification", value: "APPROVED" },
  { label: "Request more review", value: "PROCESSING" },
  { label: "Reject request", value: "REJECTED" },
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
  };

  const closeReview = () => {
    setSelected(null);
    setReviewerNote("");
    setReviewStatus("APPROVED");
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
                >
                  Review
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
            <header className="verification-modal__header">
              <div>
                <span>Verification review</span>
                <h2 id="verification-review-title">{getOrgName(selected)}</h2>
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

            <div className="verification-modal__body">
              <div className="verification-review-card verification-review-card--identity">
                <Building2 size={22} aria-hidden="true" />
                <div>
                  <span>Tax number</span>
                  <strong>{getTaxNumber(selected)}</strong>
                  <p>
                    Compare this number with the submitted registration or tax
                    authority document before approving.
                  </p>
                </div>
              </div>

              <div className="verification-doc-checklist">
                <span>Required document checklist</span>
                <label>
                  <input type="checkbox" readOnly checked />
                  Business registration certificate
                </label>
                <label>
                  <input type="checkbox" readOnly checked />
                  Tax registration or tax authority confirmation
                </label>
                <label>
                  <input type="checkbox" readOnly checked />
                  Legal representative information included
                </label>
              </div>

              <a
                className="verification-document-preview"
                href={selected.documentUrl || "#"}
                target="_blank"
                rel="noreferrer"
              >
                <FileCheck2 size={24} aria-hidden="true" />
                <span>Open submitted document</span>
                <ExternalLink size={16} aria-hidden="true" />
              </a>

              <label className="verification-field">
                Review decision
                <select
                  value={reviewStatus}
                  onChange={(event) =>
                    setReviewStatus(
                      event.target.value as Exclude<OrgVerificationStatus, "PENDING">,
                    )
                  }
                >
                  {REVIEW_STATUSES.map((item) => (
                    <option value={item.value} key={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="verification-field verification-field--wide">
                Internal note
                <textarea
                  value={reviewerNote}
                  onChange={(event) => setReviewerNote(event.target.value)}
                  placeholder="Add a short review note for this request..."
                  rows={4}
                />
              </label>
            </div>

            <footer className="verification-modal__footer">
              <button
                type="button"
                className="verification-btn verification-btn--ghost"
                onClick={closeReview}
              >
                Cancel
              </button>
              <button
                type="button"
                className="verification-btn verification-btn--primary"
                onClick={handleReview}
                disabled={submitting}
              >
                <BadgeCheck size={17} aria-hidden="true" />
                {submitting ? "Saving..." : "Save decision"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
