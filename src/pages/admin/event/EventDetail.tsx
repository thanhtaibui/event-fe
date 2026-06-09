import React, { useState } from "react";
import "../../../styles/admin/event.css";
import { useParams } from "react-router-dom";
import { useEventById } from "../../../hooks/admin/event/useEventById";
import { decodeId } from "../../../utils/hash";
// import DashboardCard from "../../../components/dashboard/DashboardCard";
import { EVENT_STATUS_STYLES } from "../../../styles/status-styles";
import { UpdateEventPopup } from "../../../components/admin/event/updateEvent";

import { TicketCard } from "../../../components/admin/ticketType/ticketCard";
import { InviteCard } from "../../../components/admin/invite/inviteCard";
import { InfoCard } from "../../../components/admin/event/infoCard";
import { StatsCard } from "../../../components/admin/event/statsCard";
import ItemModal from "../../../components/admin/item/itemModal";

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const realId = decodeId(id || "");
  const { data: event, refetch } = useEventById(realId);

  const [showPopup, setShowPopup] = useState<
    "edit" | "items" | "updateTT" | "inviteEmail" | null
  >();

  if (!id) return;

  return (
    <div className="event-detail-container">
      {showPopup === "edit" && (
        <UpdateEventPopup
          id={event.id || ""}
          onClose={() => setShowPopup(null)}
          onSuccess={() => {
            setShowPopup(null);
            refetch();
          }}
        />
      )}
      {showPopup === "items" && (
        <ItemModal
          isOpen={true}
          type="create"
          id={event.id}
          onClose={() => setShowPopup(null)}
        />
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
            {/* <span className="status-badge status-confirmed">Confirmed</span> */}
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
          {event?.eventPoster ? (
            <img
              src={
                event.eventPoster ||
                "https://via.placeholder.com/800x400?text=Event+Image"
              }
              alt="Event"
              className="hero-image"
            />
          ) : (
            <div className="hero-preview">Dashboard Preview</div>
          )}
        </div>

        <div className="right-column">
          {/* <div className="right-column"> */}
          {/* Right Column - 30% */}
          {event ? (
            <>
              <TicketCard id={event.id} />
              <InviteCard id={event.id} />
              <StatsCard id={event.id} />
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
          <InfoCard id={event.id} />
        ) : (
          <div className="animate-pulse h-20 bg-gray-200 rounded" />
        )}
      </div>
    </div>
    // </div>
  );
};

export default EventDetail;
