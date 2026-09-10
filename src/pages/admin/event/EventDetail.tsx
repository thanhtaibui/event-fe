import React, { lazy, Suspense, useState } from "react";
import "../../../styles/admin/event.css";
import { useParams } from "react-router-dom";
import { useEventById } from "../../../hooks/admin/event/useEventById";
import { decodeId } from "../../../utils/hash";
// import DashboardCard from "../../../components/dashboard/DashboardCard";
import { EVENT_STATUS_STYLES } from "../../../styles/status-styles";
import AdminSkeleton from "../../../components/admin/skeleton/AdminSkeleton";

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
const InfoCard = lazy(() =>
  import("../../../components/admin/event/infoCard").then((module) => ({
    default: module.InfoCard,
  })),
);
const StatsCard = lazy(() =>
  import("../../../components/admin/event/statsCard").then((module) => ({
    default: module.StatsCard,
  })),
);
const UpdateEventPopup = lazy(() =>
  import("../../../components/admin/event/updateEvent").then((module) => ({
    default: module.UpdateEventPopup,
  })),
);
const ItemModal = lazy(() => import("../../../components/admin/item/itemModal"));

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const realId = decodeId(id || "");
  const { data: event, loading, refetch } = useEventById(realId);
  const eventBanner = event?.eventBanner || "/default-banner.png";

  const [showPopup, setShowPopup] = useState<
    "edit" | "items" | "updateTT" | "inviteEmail" | null
  >();

  if (!id) return;

  if (loading) return <AdminSkeleton variant="detail" />;

  return (
    <div className="event-detail-container">
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

      {/* Top Header */}
      <div className="event-detail-header">
        <div>
          <h1 className="event-title">{event?.title || "Event Title"}</h1>
          <div className="status-badges">
            <span
              className="status-badge"
              style={{
                background: EVENT_STATUS_STYLES[event?.status]?.bg,
                color: EVENT_STATUS_STYLES[event?.status]?.text,
                border: `1px solid ${EVENT_STATUS_STYLES[event?.status]?.border}`,
              }}
            >
              {event?.status}
            </span>
          </div>
        </div>
        <div className="btn-content">
          <button className="edit-btn" onClick={() => setShowPopup("edit")}>
            Edit Event
          </button>
          <button className="edit-btn" onClick={() => setShowPopup("items")}>
            Show Items
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="main-layout">
        {/* Left Column - 70% */}
        {/* Hero Card */}
        <div className="hero-card">
          <img src={eventBanner} alt="Event banner" className="hero-image" />
        </div>

        <div className="right-column">
          {/* <div className="right-column"> */}
          {/* Right Column - 30% */}
          {event ? (
            <>
              <Suspense fallback={<AdminSkeleton variant="table" rows={2} />}>
                <TicketCard id={event.id} />
                <InviteCard id={event.id} />
                <StatsCard id={event.id} />
              </Suspense>
            </>
          ) : (
            <div className="animate-pulse h-20 bg-gray-200 rounded" />
          )}

          <div className="revenue-card">
            <div className="revenue-number">$124,750</div>
            <div className="revenue-currency">Forecasted Revenue</div>
            <div className="revenue-growth growth-positive">+18.5%</div>
          </div>
        </div>
        {/* Event Description */}
        <div className="event-description">
          <h3 className="section-title">Event Description</h3>
          <p className="event-desc-text">{event?.description} </p>
        </div>

        {event ? (
          <Suspense fallback={<AdminSkeleton variant="detail" />}>
            <InfoCard id={event.id} />
          </Suspense>
        ) : (
          <div className="animate-pulse h-20 bg-gray-200 rounded" />
        )}
      </div>
    </div>
    // </div>
  );
};

export default EventDetail;
