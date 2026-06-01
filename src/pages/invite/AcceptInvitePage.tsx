import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "../../styles/event/accept-invite-page.css";

import { useStatus } from "../../hooks/admin/invite/useStatus";

type PageState = "loading" | "success" | "declined" | "error";

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

const ICONS = {
  success: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  declined: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  error: (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 9V13"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 17H12.01"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M10.29 3.86L1.82 18.44C1.44 19.11 1.92 20 2.7 20H21.3C22.08 20 22.56 19.11 22.18 18.44L13.71 3.86C13.32 3.19 11.68 3.19 11.29 3.86H10.29Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  loadingSpinner: (
    <svg
      width="34"
      height="34"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 2C6.477 2 2 6.477 2 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M12 2C17.523 2 22 6.477 22 12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  ),
};

const formatDate = (raw?: string) => {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AcceptInvitePage: React.FC = () => {
  const { updateStatus } = useStatus();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const action = useMemo(() => {
    const path = typeof window !== "undefined" ? window.location.pathname : "";
    if (path.includes("/events/accept")) return "accepted";
    if (path.includes("/events/reject")) return "rejected";
    return null;
  }, []);

  const token = searchParams.get("token") ?? "";
  const inviteId = searchParams.get("inviteId") ?? searchParams.get("id") ?? "";

  const [state, setState] = useState<PageState>("loading");
  const [eventMeta, setEventMeta] = useState<{
    name: string;
    date: string;
    location: string;
  }>({
    name: searchParams.get("eventName") ?? "Event",
    date: formatDate(searchParams.get("eventDate") ?? undefined),
    location: searchParams.get("eventLocation") ?? "",
  });
  // useEffect(() => {
  //   console.log(eventMeta);
  // }, [eventMeta]);
  useEffect(() => {
    if (!action) {
      setState("error");
      return;
    }
    if (!token && !inviteId) {
      setState("error");
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setState("loading");
        const result = await updateStatus(action, token);
        if (result) {
          setEventMeta({
            name: result?.event?.name,
            date: formatDate(result.event.date),
            location: result.event.location,
          });
        }

        if (action === "accepted") {
          if (!cancelled) setState("success");
        } else {
          if (!cancelled) setState("declined");
        }
      } catch (e: any) {
        if (cancelled) return;
        const err = e as ApiError;
        if (action === "rejected") {
          setState("declined");
          return;
        }
        // For accept: treat any failure as error.
        if (err?.response?.data?.message) {
          // message exists but UI is generic by requirement.
        }
        setState("error");
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, token, inviteId]);

  const header = useMemo(() => {
    switch (state) {
      case "success":
        return {
          title: "You're confirmed! 🎉",
          subtitle: "We’re excited to see you there.",
          icon: ICONS.success,
          iconBgClass: "iconSuccess",
          gradientClass: "gradientSuccess",
        };
      case "declined":
        return {
          title: "Invitation declined",
          subtitle: "No worries — your response has been recorded.",
          icon: ICONS.declined,
          iconBgClass: "iconDeclined",
          gradientClass: "gradientDeclined",
        };
      case "error":
        return {
          title: "Link expired",
          subtitle: "Please contact the organizer for help.",
          icon: ICONS.error,
          iconBgClass: "iconError",
          gradientClass: "gradientError",
        };
      case "loading":
      default:
        return {
          title: "Processing your response...",
          subtitle: "Please wait a moment.",
          icon: ICONS.loadingSpinner,
          iconBgClass: "iconLoading",
          gradientClass: "gradientLoading",
        };
    }
  }, [state]);

  return (
    <div className="page">
      <div
        className={`card ${
          state === "loading"
            ? "cardLoading"
            : state === "success"
              ? "cardSuccess"
              : state === "declined"
                ? "cardDeclined"
                : "cardError"
        }`}
      >
        <div className={`top ${header.gradientClass}`}>
          <div className={`iconCircle ${header.iconBgClass}`}>
            <div className={state === "loading" ? "loadingIcon" : "iconStatic"}>
              {header.icon}
            </div>
          </div>

          <div className="headerText">
            <h1 className="title">{header.title}</h1>
            <p className="subtitle">{header.subtitle}</p>
          </div>
        </div>

        <div className="body">
          <div className="eventRow">
            <div className="eventName">{eventMeta.name || "Event"}</div>
            <div className="eventMeta">
              <span>{eventMeta.date ? `📅 ${eventMeta.date}` : ""}</span>
              {eventMeta.location ? (
                <span className="metaSeparator">•</span>
              ) : null}
              <span>
                {eventMeta.location ? `📍 ${eventMeta.location}` : ""}
              </span>
            </div>
          </div>

          {state === "loading" ? (
            <div className="loadingSection">
              <div className="spinnerWrap">{ICONS.loadingSpinner}</div>
              <div className="progress" aria-hidden>
                <div className="progressBar" />
              </div>
              <div className="loadingText">Processing...</div>
            </div>
          ) : state === "success" ? (
            <div className="actions">
              <div className="successExtra">
                <div className="successLine">You’re confirmed! 🎉</div>
              </div>
              <div className="actionRow">
                <button
                  type="button"
                  className={`btn btnPrimaryPurple`}
                  onClick={() => navigate("/events")}
                >
                  View Event Details
                </button>
                <button
                  type="button"
                  className={`btn btnGhost`}
                  onClick={() => {
                    // Placeholder behavior: if backend provides calendar link later, swap to it.
                    navigate("/events");
                  }}
                >
                  Add to Calendar
                </button>
              </div>
            </div>
          ) : state === "declined" ? (
            <div className="actions">
              <div className="declinedLine">Changed your mind? Accespt now</div>
              <div className="actionRow">
                <button
                  type="button"
                  className={`btn btnPrimaryPurple`}
                  onClick={() => navigate("/events/accept")}
                >
                  Accept now
                </button>
                <button
                  type="button"
                  className={`btn btnGhost`}
                  onClick={() => navigate("/events")}
                >
                  View Event Details
                </button>
              </div>
            </div>
          ) : (
            <div className="actions">
              <div className="errorLine">Contact Organizer</div>
              <div className="actionRow">
                <button
                  type="button"
                  className={`btn btnDark`}
                  onClick={() => navigate("/contact")}
                >
                  Contact Organizer
                </button>
                <button
                  type="button"
                  className={`btn btnGhost`}
                  onClick={() => navigate("/")}
                >
                  Go to Homepage
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="footer">
          <span>
            {state === "success"
              ? "Tip: Save the date for quick access."
              : state === "declined"
                ? "You can always accept later if the organizer allows."
                : state === "error"
                  ? "If you received this via email, request a new invitation link."
                  : "We’ll take you to the right place shortly."}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;
