import React, { lazy, Suspense, useMemo, useRef, useState } from "react";
import "../../../styles/admin/event.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEventById } from "../../../hooks/admin/event/useEventById";
import { decodeId } from "../../../utils/hash";
import { EVENT_STATUS_STYLES } from "../../../styles/status-styles";
import AdminSkeleton from "../../../components/admin/skeleton/AdminSkeleton";
import ConfirmDialog from "../../../components/admin/layout/DialogConfirm";
import { eventService } from "../../../services/admin/event.service";
import { toast } from "react-toastify";
import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "../../../constants/authStorage";
import { useOrgsByUser } from "../../../hooks/admin/org/useOrgsByUser";
import type { JwtPayloadCustom } from "../../../types/JwtPayloadCustom";
import {
  ADMIN_PERMISSION_CODES,
  getEffectiveOrgPermissionCodes,
  getJwtPermissionCodes,
  getMembershipSlug,
  hasAnyPermission,
  normalizeUserMemberships,
} from "../../../config/adminPermissionConfig";
import {
  CalendarDays,
  Clock3,
  FileText,
  ArrowLeft,
  Building2,
  Edit3,
  Layers3,
  MapPin,
  Radio,
  Ticket,
  UsersRound,
} from "lucide-react";

const TicketCard = lazy(() =>
  import("../../../components/admin/ticketType/ticketCard").then((module) => ({
    default: module.TicketCard,
  })),
);
const InviteCard = lazy(() =>
  import("../../../components/admin/invite/inviteCard").then((module) => ({
    default: module.InviteCard,
  })),
);
const UpdateEventPopup = lazy(() =>
  import("../../../components/admin/event/updateEvent").then((module) => ({
    default: module.UpdateEventPopup,
  })),
);
const ItemModal = lazy(() => import("../../../components/admin/item/itemModal"));

const formatDetailDate = (date?: string | Date) => {
  if (!date) return "Not scheduled";
  return new Date(date).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

type EventDetailHeaderProps = {
  event: any;
  eventBanner: string;
  eventStatusStyle: any;
  onBack: () => void;
  onEdit: () => void;
  onLocationClick: () => void;
  onShowItems: () => void;
  onPublish: () => void;
  canPublish: boolean;
};

function EventHeader({
  event,
  eventBanner,
  eventStatusStyle,
  onBack,
  onEdit,
  onLocationClick,
  onShowItems,
  onPublish,
  canPublish,
}: EventDetailHeaderProps) {
  return (
    <section className="admin-event-hero admin-event-detail-card">
      <div className="admin-event-hero__media">
        <img src={eventBanner} alt={`${event.title} banner`} />
      </div>
      <div className="admin-event-hero__content">
        <div className="admin-event-hero__topline">
          <button
            type="button"
            className="admin-event-back-link"
            onClick={onBack}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back
          </button>
          <span
            className="admin-event-status"
            style={{
              background: eventStatusStyle.bg,
              color: eventStatusStyle.text,
              border: `1px solid ${eventStatusStyle.border}`,
            }}
          >
            {event.status}
          </span>
        </div>
        <h1 title={event.title}>{event.title}</h1>
        <div className="admin-event-hero__meta">
          <span>
            <Building2 size={15} aria-hidden="true" />
            {event.organization?.name || "No organizer"}
          </span>
          <button
            type="button"
            className="admin-event-hero__location"
            onClick={onLocationClick}
          >
            <MapPin size={15} aria-hidden="true" />
            {event.place || "No location"}
          </button>
        </div>
        <div className="admin-event-actions">
          <button
            className="admin-event-action admin-event-action--primary"
            onClick={onEdit}
          >
            <Edit3 size={16} aria-hidden="true" />
            Edit Event
          </button>
          <button className="admin-event-action" onClick={onShowItems}>
            <Layers3 size={16} aria-hidden="true" />
            Show Items
          </button>
          {canPublish && (
            <button className="admin-event-action" onClick={onPublish}>
              <Radio size={16} aria-hidden="true" />
              Publish Event
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function EventStats({
  soldTickets,
  capacity,
  capacityRate,
  registrationEndDate,
}: {
  soldTickets: number;
  capacity: number;
  capacityRate: number;
  registrationEndDate?: string | Date;
}) {
  const stats = [
    {
      label: "Ticket sold",
      value: soldTickets.toLocaleString("vi-VN"),
      icon: <Ticket size={18} aria-hidden="true" />,
      tone: "ticket",
    },
    {
      label: "Capacity",
      value: capacity.toLocaleString("vi-VN"),
      icon: <UsersRound size={18} aria-hidden="true" />,
      tone: "capacity",
    },
    {
      label: "Fill rate",
      value: `${capacityRate}%`,
      icon: <Radio size={18} aria-hidden="true" />,
      tone: "fill",
    },
    {
      label: "Registration deadline",
      value: formatDetailDate(registrationEndDate),
      icon: <Clock3 size={18} aria-hidden="true" />,
      tone: "deadline",
    },
  ];

  return (
    <section className="admin-event-summary" aria-label="Event summary">
      {stats.map((stat) => (
        <article
          className={`admin-event-detail-card admin-event-stat-card admin-event-stat-card--${stat.tone}`}
          key={stat.label}
        >
          <span className="admin-event-stat-card__icon">{stat.icon}</span>
          <small>{stat.label}</small>
          <strong>{stat.value}</strong>
        </article>
      ))}
    </section>
  );
}

function EventInformation({ event }: { event: any }) {
  return (
    <>
      <section className="admin-event-section admin-event-detail-card">
        <div className="admin-event-section__heading">
          <span className="admin-event-section__icon">
            <FileText size={17} aria-hidden="true" />
          </span>
          <div>
            <span>Description</span>
            <h2>About the event</h2>
          </div>
        </div>
        <p className="admin-event-description">
          {event.description || "No description provided."}
        </p>
      </section>

      <section className="admin-event-info-grid">
        <article className="admin-event-info-card admin-event-detail-card">
          <span className="admin-event-info-card__icon admin-event-info-card__icon--schedule">
            <CalendarDays size={19} aria-hidden="true" />
          </span>
          <div className="admin-event-info-card__heading">
            <small>Schedule</small>
            <h2>Event timeline</h2>
          </div>
          <div className="admin-event-schedule-grid">
            <div className="admin-event-schedule-block">
              <span>Start time</span>
              <strong>{formatDetailDate(event.startDateTime)}</strong>
            </div>
            <div className="admin-event-schedule-block">
              <span>End time</span>
              <strong>{formatDetailDate(event.endDateTime)}</strong>
            </div>
          </div>
        </article>
      </section>
    </>
  );
}

function EventLocation({
  event,
  locationRef,
  isHighlighted,
}: {
  event: any;
  locationRef: React.RefObject<HTMLElement | null>;
  isHighlighted: boolean;
}) {
  return (
    <section
      ref={locationRef}
      className={`admin-event-location admin-event-detail-card${
        isHighlighted ? " is-highlighted" : ""
      }`}
      tabIndex={-1}
    >
      <div className="admin-event-section__heading">
        <span className="admin-event-section__icon admin-event-section__icon--location">
          <MapPin size={17} aria-hidden="true" />
        </span>
        <div>
          <span>Location</span>
          <h2>Venue & map</h2>
        </div>
      </div>
      <div className="admin-event-location__body">
        {event.place && (
          <div className="admin-event-map">
            <iframe
              title={`${event.title} location`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                event.place,
              )}&output=embed`}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function EventRelatedSidebar({ eventId }: { eventId: string }) {
  return (
    <aside className="admin-event-side">
      <section className="admin-event-related admin-event-detail-card">
        <div className="admin-event-section__heading">
          <span>Related data</span>
          <h2>Tickets & invites</h2>
        </div>
        <Suspense fallback={<AdminSkeleton variant="table" rows={2} />}>
          <div className="admin-event-related__stack">
            <TicketCard id={eventId} />
            <InviteCard id={eventId} />
          </div>
        </Suspense>
      </section>
    </aside>
  );
}

const EventDetail: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();
  const locationRef = useRef<HTMLElement | null>(null);
  const realId = decodeId(id || "");
  const { data: event, loading, refetch } = useEventById(realId);
  const eventBanner = event?.eventBanner || "/default-banner.png";
  const [highlightLocation, setHighlightLocation] = useState(false);
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return "";

    try {
      return jwtDecode<JwtPayloadCustom>(token).sub || "";
    } catch {
      return "";
    }
  }, []);
  const { data: membershipData } = useOrgsByUser(slug ? currentUserId : "");
  const permissionCodes = useMemo(() => {
    if (!slug) return getJwtPermissionCodes();

    const membership = normalizeUserMemberships(membershipData).find(
      (item) => getMembershipSlug(item) === slug,
    );

    return membership
      ? getEffectiveOrgPermissionCodes(membership, currentUserId)
      : new Set<string>();
  }, [currentUserId, membershipData, slug]);

  const [showPopup, setShowPopup] = useState<
    "edit" | "items" | "updateTT" | "inviteEmail" | null
  >();

  if (!id) return;

  if (loading) return <AdminSkeleton variant="detail" />;
  if (!event) {
    return (
      <div className="event-detail-container admin-event-workspace">
        <section className="admin-event-empty-detail">
          <CalendarDays size={30} aria-hidden="true" />
          <h2>Event not found</h2>
          <p>Không tìm thấy dữ liệu sự kiện từ API hiện tại.</p>
        </section>
      </div>
    );
  }

  const eventStatusStyle =
    EVENT_STATUS_STYLES[event.status] || EVENT_STATUS_STYLES.UPCOMING;
  const soldTickets = event.soldTickets || 0;
  const capacity = event.capacity || 0;
  const capacityRate = capacity
    ? Math.min(Math.round((soldTickets / capacity) * 100), 100)
    : 0;
  const isDraftEvent = String(event.status || "").toLowerCase() === "draft";
  const canPublishEvent =
    isDraftEvent &&
    hasAnyPermission(permissionCodes, [
      ADMIN_PERMISSION_CODES.EVENT,
      ADMIN_PERMISSION_CODES.EVENT_UPDATE,
      ADMIN_PERMISSION_CODES.EVENT_MANAGE,
    ]);
  const handleLocationClick = () => {
    locationRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setHighlightLocation(true);
    window.setTimeout(() => setHighlightLocation(false), 1400);
  };
  const handleBackToEvents = () => {
    navigate(slug ? `/org/${slug}/events` : "/admin/events");
  };
  const handlePublishEvent = async () => {
    if (!event?.id || publishLoading) return;

    try {
      setPublishLoading(true);
      const response = await eventService.publishEvent(event.id);
      toast.success(response?.message || "Publish event successfully");
      setPublishConfirmOpen(false);
      await refetch();
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <div className="event-detail-container admin-event-workspace">
      <ConfirmDialog
        open={publishConfirmOpen}
        onClose={() => setPublishConfirmOpen(false)}
        onConfirm={handlePublishEvent}
        loading={publishLoading}
        title="Publish Event?"
        message="Are you sure you want to publish this event? The event will become visible to users."
        cancelLabel="Cancel"
        confirmLabel="Publish"
      />
      {showPopup === "edit" && (
        <Suspense fallback={null}>
          <UpdateEventPopup
            id={event.id || ""}
            onClose={() => setShowPopup(null)}
            onSuccess={() => {
              setShowPopup(null);
              refetch();
            }}
          />
        </Suspense>
      )}
      {showPopup === "items" && (
        <Suspense fallback={null}>
          <ItemModal
            isOpen={true}
            type="create"
            id={event.id}
            onClose={() => setShowPopup(null)}
          />
        </Suspense>
      )}

      <EventHeader
        event={event}
        eventBanner={eventBanner}
        eventStatusStyle={eventStatusStyle}
        onBack={handleBackToEvents}
        onEdit={() => setShowPopup("edit")}
        onLocationClick={handleLocationClick}
        onShowItems={() => setShowPopup("items")}
        onPublish={() => setPublishConfirmOpen(true)}
        canPublish={canPublishEvent}
      />

      <EventStats
        soldTickets={soldTickets}
        capacity={capacity}
        capacityRate={capacityRate}
        registrationEndDate={event.registrationEndDate}
      />

      <div className="admin-event-layout">
        <main className="admin-event-main">
          <EventInformation event={event} />
          <EventLocation
            event={event}
            locationRef={locationRef}
            isHighlighted={highlightLocation}
          />
        </main>

        <EventRelatedSidebar eventId={event.id} />
      </div>
    </div>
  );
};

export default EventDetail;
