import React, { useState } from "react";
import "../../../styles/admin/event.css";
import { useParams } from "react-router-dom";
import { useEventById } from "../../../hooks/admin/event/useEventById";
import { decodeId } from "../../../utils/hash";
// import DashboardCard from "../../../components/dashboard/DashboardCard";
import { EVENT_STATUS_STYLES } from "../../../styles/status-styles";
import { useTicketTypeByIdEvent } from "../../../hooks/admin/event/useTicketTypes";
import { UpdateEventPopup } from "../../../components/event/updateEvent";
import { CreateTT } from "../../../components/ticketType/createTT";
import { UpdateTT } from "../../../components/ticketType/updateTT";
import { Cursor3D } from "../../../components/layout/Cursor3D";

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const realId = decodeId(id || "");
  const { data: event, refetch } = useEventById(realId);
  const [ticketId, setTicketId] = useState<string>("");
  const { data: ticketTypes, refetch: refTicketType } =
    useTicketTypeByIdEvent(realId);
  const [showPopup, setShowPopup] = useState<
    "edit" | "createTT" | "updateTT" | null
  >();

  const [cursorHover, setCursorHover] = useState(false);
  const [cursorPress, setCursorPress] = useState(false);

  if (!id) return;

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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };
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
      {showPopup === "createTT" && (
        <CreateTT
          id={event.id || ""}
          onClose={() => setShowPopup(null)}
          onSuccess={() => {
            setShowPopup(null);
            refTicketType();
          }}
        />
      )}
      {showPopup === "updateTT" && (
        <UpdateTT
          id={ticketId || ""}
          eventId={event.id || ""}
          onClose={() => setShowPopup(null)}
          onSuccess={() => {
            setShowPopup(null);
            refTicketType();
          }}
        />
      )}
      <Cursor3D show={cursorHover} press={cursorPress} />

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
        <button className="edit-btn" onClick={() => setShowPopup("edit")}>
          Edit Event
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="main-layout">
        {/* Left Column - 70% */}
        <div className="left-column">
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

          {/* Event Description */}
          <div className="event-description">
            <h3 className="section-title">Event Description</h3>
            <p className="event-desc-text">{event?.description} </p>
          </div>

          {/* Info Section - 2 cards row */}
          <div className="info-grid">
            <div className="info-card">
              <div
                className="info-content"
                title={`${event?.place || "No location provided"}`}
              >
                <div className="info-icon">
                  <img
                    width="24"
                    height="24"
                    src="https://img.icons8.com/nolan/64/place-marker.png"
                    alt="place-marker"
                  />
                </div>
                <h4>Place</h4>
                <div className="org-detail__map">
                  {" "}
                  <iframe
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      `${event?.place || "Việt Nam"}`,
                    )}&output=embed`}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <img
                  width="24"
                  height="24"
                  src="https://img.icons8.com/nolan/64/calendar.png"
                  alt="calendar"
                />
              </div>
              <div className="info-content">
                <h4>Date & Time</h4>
                <p>
                  <span
                    style={{
                      display: "block",
                    }}
                  >
                    {formatDate(event?.startDateTime || "")} <br />—<br />
                    {formatDate(event?.endDateTime || "")}
                  </span>
                  <br />
                  <span>
                    Reg. deadline:
                    <span
                      style={{
                        color: "#cb0000",
                        marginLeft: "5px",
                        fontWeight: "700",
                      }}
                    >
                      {formatDate(event?.registrationEndDate || "")}
                    </span>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 30% */}
        <div className="right-column">
          {/* Ticket Types */}
          <div className="tickets-card" style={{ position: "relative" }}>
            <div className="tickets-title">
              <h3>Ticket Types</h3>
              <button onClick={() => setShowPopup("createTT")}>
                Add Tier +
              </button>
            </div>
            {ticketTypes && ticketTypes.length > 0 ? (
              ticketTypes.map((ticketType: any) => {
                const percentage =
                  (ticketType.quantity / ticketType.total_quantity) * 100;

                let statusStyle: React.CSSProperties = {
                  color: "#2fc96a",
                };
                if (ticketType.quantity <= 0) {
                  statusStyle = {
                    color: "#acacac",
                  };
                } else if (percentage <= 15) {
                  statusStyle = {
                    color: "#ef4444",
                  };
                } else if (percentage <= 50) {
                  statusStyle = {
                    color: "#f59e0b",
                  };
                }

                return (
                  <div
                    key={ticketType.id}
                    className="ticket-item"
                    style={{
                      cursor: `url('https://img.icons8.com/external-basicons-solid-edtgraphics/24/external-Touch-gesture-touch-gestures-basicons-solid-edtgraphics-16.png'), auto`,
                    }}
                    onDoubleClick={() => {
                      setTicketId(ticketType.id);
                      setShowPopup("updateTT");
                    }}
                    onPointerEnter={() => setCursorHover(true)}
                    onPointerLeave={() => {
                      setCursorPress(false);
                      setCursorHover(false);
                    }}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setCursorPress(true);
                    }}
                    onPointerUp={() => {
                      // Giữ hover SVG lại ngay cả sau khi thả chuột (không tắt cursorHover)
                      setCursorPress(false);
                    }}
                    onPointerCancel={() => setCursorPress(false)}
                  >
                    <div className="ticket-info">
                      <h5 className="ticket-item__name">{ticketType.name}</h5>
                      <span
                        className={`ticket-status`}
                        style={statusStyle ? { ...statusStyle } : {}}
                      >
                        {ticketType.quantity > 0
                          ? `Only ${new Intl.NumberFormat("vi-VN").format(ticketType.quantity)} left`
                          : "Sold Out"}
                      </span>
                    </div>
                    <div className="ticket-price">
                      {formatPrice(ticketType.price)}{" "}
                      <span className="currency">VND</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="ticket-empty">
                <div className="img-tier">
                  <img
                    width="32"
                    height="32"
                    src="https://img.icons8.com/windows/32/ticket.png"
                    alt="ticket"
                  />
                </div>
                <h3 className="empty__title">No Ticket Types Yet</h3>
                <p className="empty__description">
                  Create your first ticket tier to start selling
                </p>
                <button
                  className="btn-tier"
                  onClick={() => {
                    setShowPopup("createTT");
                  }}
                >
                  + Create Ticket Tier
                </button>
              </div>
            )}
          </div>

          {/* Invite Summary */}
          <div className="invites-card">
            <div className="header-invites">
              <img
                width="35"
                height="35"
                src="https://img.icons8.com/nolan/64/invite.png"
                alt="invite"
              />
              <h3
                className="section-title"
                style={{ color: "#1e293b", marginBottom: "1rem" }}
              >
                Invites Summary
              </h3>
            </div>
            <div className="total-invites">
              <div className="img-send">
                <img
                  width="35"
                  height="35"
                  src="https://img.icons8.com/pulsar-gradient/48/filled-sent.png"
                  alt="filled-sent"
                />
              </div>
              <div className="note">
                <h3 className="section-title">Total Invitations</h3>
                <p>Emails send to waitlist</p>
              </div>

              <div className="invites-number">1,247</div>
            </div>

            <div className="invites-stats">
              <div className="stat-item">
                <div className="stat-label-accepted">Accepted</div>
                <div className="stat-value stat-accepted">68%</div>
              </div>
              <div className="stat-item">
                <div className="stat-label-pending">Pending</div>
                <div className="stat-value stat-pending">32%</div>
              </div>
            </div>
            <button className="manage-guests-btn">Manage Guest List</button>
          </div>

          {/* Revenue Forecast */}
          <div className="revenue-card">
            <div className="revenue-number">$124,750</div>
            <div className="revenue-currency">Forecasted Revenue</div>
            <div className="revenue-growth growth-positive">+18.5%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;
