import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import ConfirmDialog from "../layout/DialogConfirm";
import { useSend } from "../../../hooks/admin/invite/useSend";
import { useCheckEmail } from "../../../hooks/admin/invite/useCheckEmail";
import api from "../../../services/api";
import "../../../styles/admin/invite/invite-popup.css";
import { STATUS_CONFIG } from "../../../styles/status-styles";
export type EmailStatus =
  | "idle"
  | "checking"
  | "valid"
  | "already_invited"
  | "not_exists"
  | "invalid_format";

type EmailRow = { email: string; status: EmailStatus };
type InviteRoleOption = {
  id: string;
  role_name?: string;
  role_code?: string;
};

export type InvitePopupProps = {
  isOpen: boolean;
  eventId?: string;
  organizationId?: string;
  mode?: "event" | "organization";
  roles?: InviteRoleOption[];
  rolesLoading?: boolean;
  onClosePopup: () => void;
  onSuccess?: () => void;
  eventName?: string;
};

const ERROR_STATUSES: EmailStatus[] = ["not_exists", "invalid_format"];
const MEMBER_NOT_FOUND_MESSAGE = "Không tìm thấy tài khoản với email này.";
const MEMBER_FORBIDDEN_MESSAGE = "Bạn không có quyền mời thành viên.";
const MEMBER_INVITE_FAILED_MESSAGE = "Gửi lời mời thất bại.";

function getMembershipInviteErrorMessage(error: any) {
  const status = error?.response?.status;
  if (status === 404) return MEMBER_NOT_FOUND_MESSAGE;
  if (status === 403) return MEMBER_FORBIDDEN_MESSAGE;
  if (
    error?.message === MEMBER_NOT_FOUND_MESSAGE ||
    error?.message === MEMBER_FORBIDDEN_MESSAGE
  ) {
    return error.message;
  }
  return MEMBER_INVITE_FAILED_MESSAGE;
}

async function lookupMembershipUserIdByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await api.get(
      "/membership/users/lookup",
      {
        params: { email: normalizedEmail },
        skipGlobalToast: true,
      } as any,
    );
    const userId = response.data?.data?.id || response.data?.id || "";
    if (!userId) throw new Error(MEMBER_NOT_FOUND_MESSAGE);

    return userId;
  } catch (error: any) {
    throw new Error(getMembershipInviteErrorMessage(error));
  }
}

function parseEmails(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
}

export const InvitePopup: React.FC<InvitePopupProps> = ({
  isOpen,
  eventId = "",
  organizationId = "",
  mode = "event",
  roles = [],
  rolesLoading = false,
  onClosePopup,
  onSuccess,
  eventName = "Event",
}) => {
  const [rawInput, setRawInput] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [filter, setFilter] = useState<"all" | "valid" | "error">("all");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirm, setConfirm] = useState<"clearAll" | "send" | null>(null);

  const { sendEmail } = useSend();
  const { checkEmails } = useCheckEmail();

  const parsedCount = parseEmails(rawInput).length;

  const validRows = rows.filter((r) => r.status === "valid");
  const errorRows = rows.filter((r) => ERROR_STATUSES.includes(r.status));

  const filteredRows = rows.filter((r) => {
    if (filter === "valid") return r.status === "valid";
    if (filter === "error") return ERROR_STATUSES.includes(r.status);
    return true;
  });
  // useEffect(() => {
  //   console.log(rows);
  // }, [rows]);
  const handleCheck = async () => {
    const emails = parseEmails(rawInput);
    // console.log(emails);
    if (!emails.length) return;

    // set all to checking instantly
    setRows(emails.map((email) => ({ email, status: "checking" })));
    // console.log(rows);
    setChecking(true);
    setFilter("all");

    try {
      const results: { email: string; status: EmailStatus }[] =
        await checkEmails({ emails, eventId });
      setRows(results);
    } catch {
      toast.error("Failed to check emails");
      setRows(emails.map((email) => ({ email, status: "invalid_format" })));
    } finally {
      setChecking(false);
    }
  };

  const handleRemoveRow = (email: string) => {
    setRows((prev) => prev.filter((r) => r.email !== email));
  };

  const handleRemoveErrors = () => {
    setRawInput(
      rows
        .filter((r) => !ERROR_STATUSES.includes(r.status))
        .map((r) => r.email)
        .join(", "),
    );
    setRows((prev) => prev.filter((r) => !ERROR_STATUSES.includes(r.status)));
  };

  const handleClearAll = () => {
    setRows([]);
    setRawInput("");
    setConfirm(null);
  };

  const handleSubmit = async () => {
    if (!validRows.length || loading) return;
    setLoading(true);
    try {
      setConfirm(null);
      await toast.promise(
        sendEmail({
          emailInvite: validRows.map((r) => r.email),
          eventId,
          message: message || "",
        }),
        {
          pending: "Sending invitations...",
          success: "Invitations sent successfully",
          error: "Failed to send invitations",
        },
      );
      onSuccess?.();
      onClosePopup();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send invitations");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleOrganizationInvite = async () => {
    const emails = parseEmails(memberEmail);
    if (!emails.length || !selectedRoleId || !organizationId || loading) return;

    setLoading(true);
    try {
      await Promise.all(
        emails.map(async (email) => {
          const userId = await lookupMembershipUserIdByEmail(email);

          return api.post(
            "/membership",
            {
              userId,
              roleId: selectedRoleId,
              orgId: organizationId,
            },
            { skipGlobalToast: true } as any,
          );
        }),
      );
      toast.success("Invitation sent successfully");
      onSuccess?.();
      onClosePopup();
    } catch (err: any) {
      toast.error(getMembershipInviteErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="invite-overlay" onClick={onClosePopup}>
      <ConfirmDialog
        open={confirm !== null}
        onConfirm={() => {
          if (confirm === "clearAll") {
            handleClearAll();
            return;
          }

          if (confirm === "send") return handleSubmit();
        }}
        onClose={() => setConfirm(null)}
        loading={loading}
      />

      <div
        className="invite-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Invite guests"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="invite-modal__header">
          <div className="invite-modal__header-left">
            <div className="invite-modal__icon" aria-hidden>
              <img
                width="24"
                height="24"
                src="https://img.icons8.com/ios-glyphs/30/new-post.png"
                alt=""
              />
            </div>
            <div>
              <h2 className="invite-modal__title">
                {mode === "organization" ? "Invite Member" : "Invite Guests"}
              </h2>
              <p className="invite-modal__subtitle">{eventName}</p>
            </div>
          </div>
          <button
            className="invite-icon-close"
            onClick={onClosePopup}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        {mode === "organization" ? (
          <div className="invite-modal__body">
            <div className="invite-field">
              <label className="invite-label" htmlFor="member-email">
                Email/user cần mời
              </label>
              <input
                id="member-email"
                className="invite-textarea invite-textarea--message"
                value={memberEmail}
                placeholder="member@example.com"
                onChange={(event) => setMemberEmail(event.target.value)}
              />
            </div>

            <div className="invite-field">
              <label className="invite-label" htmlFor="member-role">
                Select Role
              </label>
              <select
                id="member-role"
                className="invite-textarea invite-textarea--message"
                value={selectedRoleId}
                onChange={(event) => setSelectedRoleId(event.target.value)}
                disabled={rolesLoading}
              >
                <option value="">
                  {rolesLoading ? "Loading roles..." : "Choose a role"}
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name || role.role_code || "Role"}
                  </option>
                ))}
              </select>
            </div>

            <div className="invite-field">
              <label className="invite-label" htmlFor="member-message">
                Invitation message{" "}
                <span className="invite-label--optional">(Optional)</span>
              </label>
              <textarea
                id="member-message"
                className="invite-textarea invite-textarea--message"
                value={message}
                placeholder="Write a short invitation message"
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
          </div>
        ) : (
        <div className="invite-modal__body">
          {/* Step 1 — Raw input */}
          <div className="invite-field">
            <label className="invite-label" htmlFor="raw-emails">
              Recipient emails
            </label>
            <textarea
              id="raw-emails"
              className="invite-textarea"
              value={rawInput}
              placeholder={
                "Paste or type emails — one per line or comma-separated\ne.g. alice@gmail.com, bob@company.com"
              }
              onChange={(e) => setRawInput(e.target.value)}
              // onPaste={(e) => {
              // }}
            />
            <div className="invite-input-footer">
              <span className="invite-count">
                {parsedCount > 0
                  ? `${parsedCount} email${parsedCount !== 1 ? "s" : ""}`
                  : ""}
              </span>
              <button
                className="invite-btn invite-btn--check"
                onClick={handleCheck}
                disabled={!parsedCount || checking}
              >
                {checking ? "Checking..." : "Check emails"}
              </button>
            </div>
          </div>

          {/* Step 2 — Results table */}
          {rows.length > 0 ? (
            <div className="invite-field">
              <div className="invite-results-header">
                <span className="invite-label" style={{ margin: 0 }}>
                  Results
                </span>
                <div className="invite-filter-tabs">
                  {(["all", "valid", "error"] as const).map((f) => (
                    <button
                      key={f}
                      className={`invite-filter-tab ${filter === f ? "invite-filter-tab--active" : ""}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === "all" && `All (${rows.length})`}
                      {f === "valid" && `Valid (${validRows.length})`}
                      {f === "error" && `Errors (${errorRows.length})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="invite-table-wrap">
                {filteredRows.length === 0 ? (
                  <div className="invite-table-empty">
                    No results for this filter.
                  </div>
                ) : (
                  filteredRows.map((row) => {
                    const cfg = STATUS_CONFIG[row.status];
                    return (
                      <div
                        key={row.email}
                        className="invite-table-row"
                        style={{
                          background: cfg.bg,
                          color: cfg.color,
                          border: `1.5px solid ${cfg.border}`,
                        }}
                      >
                        <span
                          className="invite-table-email"
                          style={{
                            color: cfg.color,
                          }}
                        >
                          {row.email}
                        </span>
                        <span
                          className="invite-status-badge"
                          style={{ border: `1.5px solid ${cfg.border}` }}
                        >
                          <span
                            className={
                              row.status === "checking" ? "invite-spin" : ""
                            }
                          >
                            {cfg.icon}
                          </span>
                          {cfg.label}
                        </span>
                        <button
                          className="invite-row-remove"
                          onClick={() => handleRemoveRow(row.email)}
                          aria-label={`Remove ${row.email}`}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="invite-table-footer">
                <span className="invite-table-summary">
                  {validRows.length} valid · {errorRows.length} error
                  {errorRows.length !== 1 ? "s" : ""} · {rows.length} total
                </span>
                <div className="invite-table-actions">
                  {errorRows.length > 0 && (
                    <button
                      className="invite-btn invite-btn--danger-ghost"
                      onClick={handleRemoveErrors}
                    >
                      Remove errors
                    </button>
                  )}
                  <button
                    className="invite-btn invite-btn--ghost-sm"
                    onDoubleClick={() => setConfirm("clearAll")}
                    title="Double-click to clear all"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="invite-empty-state">
              <p
                style={{
                  color: "#9f9f9f",
                  fontSize: "13px",
                }}
              >
                Please enter emails to start checking.
              </p>
            </div>
          )}

          <div className="invite-divider" />

          {/* Step 3 — Message */}
          <div className="invite-field">
            <label className="invite-label" htmlFor="invite-message">
              Invitation message{" "}
              <span className="invite-label--optional">(Optional)</span>
            </label>
            <textarea
              id="invite-message"
              className="invite-textarea invite-textarea--message"
              value={message}
              placeholder="Write a short invitation message"
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>
        )}

        {/* ── Footer ── */}
        <div className="invite-modal__footer">
          <button
            className="invite-btn invite-btn--ghost"
            onClick={onClosePopup}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="invite-btn invite-btn--primary"
            onClick={() => {
              if (mode === "organization") {
                handleOrganizationInvite();
                return;
              }
              setConfirm("send");
            }}
            disabled={
              mode === "organization"
                ? !memberEmail.trim() ||
                  !selectedRoleId ||
                  !organizationId ||
                  loading ||
                  rolesLoading
                : !validRows.length || loading
            }
          >
            <img
              width="24"
              height="24"
              alt="filled-sent"
              src="https://img.icons8.com/pulsar-gradient/35/filled-sent.png"
            ></img>
            {loading
              ? "Sending..."
              : mode === "organization"
                ? "Submit Invite"
                : `Send Invitations${validRows.length > 0 ? ` (${validRows.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
