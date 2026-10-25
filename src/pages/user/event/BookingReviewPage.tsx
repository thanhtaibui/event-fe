import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Clock,
  MapPin,
  Ticket,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
  formatBookingPrice,
  useBookingCart,
} from "../../../contexts/BookingCartContext";
import { decodeId } from "../../../utils/hash";

import "../../../styles/user/event/eventDetail.css";

function formatEventDate(value?: string | Date) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(value?: string | Date) {
  if (!value) return "Time TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time TBA";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getTicketAccentClass(name?: string) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("vip")) return "booking-review__ticket--vip";
  if (lower.includes("early")) return "booking-review__ticket--early";
  return "booking-review__ticket--standard";
}

export default function BookingReviewPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const realEventId = eventId ? decodeId(eventId) : "";
  const { getItemsForEvent } = useBookingCart();
  const items = getItemsForEvent(realEventId);

  const summary = useMemo(() => {
    const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = items.reduce(
      (total, item) => total + Number(item.ticket.price ?? 0) * item.quantity,
      0,
    );

    return { totalPrice, totalQuantity };
  }, [items]);

  const event = items[0]?.event;

  if (!event) {
    return (
      <main className="booking-review booking-review--empty">
        <section className="booking-review__emptyCard">
          <span className="booking-review__emptyIcon">
            <Ticket size={28} aria-hidden="true" />
          </span>
          <h1>No tickets selected</h1>
          <p>Please add tickets before reviewing your booking.</p>
          <Link
            className="booking-review__emptyAction"
            to={eventId ? `/app/events/${eventId}` : "/app/events"}
          >
            Browse events
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-review">
      <div className="booking-review__container">
        <div className="booking-review__topNav">
          <button
            type="button"
            className="booking-review__back"
            onClick={() => navigate(`/app/events/${eventId || event.encodedId}`)}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to event</span>
          </button>
          <span className="booking-review__pageTitle">Review your booking</span>
        </div>

        <div className="booking-review__layout">
          {/* LEFT CONTENT (70%) */}
          <div className="booking-review__main">
            {/* 1. EVENT SUMMARY CARD */}
            <section className="booking-review__card booking-review__eventCard">
              {event.eventBanner ? (
                <div className="booking-review__eventImageWrap">
                  <img
                    src={event.eventBanner}
                    alt={event.title}
                    className="booking-review__eventImage"
                  />
                </div>
              ) : null}

              <div className="booking-review__eventContent">
                <h1 className="booking-review__eventTitle">{event.title}</h1>

                <div className="booking-review__metaGrid">
                  <div className="booking-review__metaItem">
                    <span className="booking-review__metaIcon">
                      <CalendarDays size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <small>Date</small>
                      <strong>{formatEventDate(event.startDateTime)}</strong>
                    </div>
                  </div>

                  <div className="booking-review__metaItem">
                    <span className="booking-review__metaIcon">
                      <Clock size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <small>Time</small>
                      <strong>{formatEventTime(event.startDateTime)}</strong>
                    </div>
                  </div>

                  <div className="booking-review__metaItem">
                    <span className="booking-review__metaIcon">
                      <MapPin size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <small>Location</small>
                      <strong>{event.place || "Location to be announced"}</strong>
                    </div>
                  </div>

                  <div className="booking-review__metaItem">
                    <span className="booking-review__metaIcon">
                      <Building2 size={16} aria-hidden="true" />
                    </span>
                    <div>
                      <small>Organizer</small>
                      <strong>
                        {event.organizationName || "Official Organizer"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. SELECTED TICKETS */}
            <section className="booking-review__card booking-review__ticketsCard">
              <div className="booking-review__sectionHead">
                <div>
                  <h2>Your tickets</h2>
                </div>
                <span className="booking-review__ticketBadge">
                  {summary.totalQuantity}{" "}
                  {summary.totalQuantity === 1 ? "ticket" : "tickets"}
                </span>
              </div>

              <div
                className="booking-review__ticketsList"
                aria-label="Selected tickets"
              >
                {items.map((item) => {
                  const lineTotal =
                    Number(item.ticket.price ?? 0) * item.quantity;
                  const accentClass = getTicketAccentClass(item.ticket.name);

                  return (
                    <article
                      className={`booking-review__ticketItem ${accentClass}`}
                      key={`${item.event.id}-${item.ticket.id}`}
                    >
                      <div className="booking-review__ticketInfo">
                        <strong className="booking-review__ticketName">
                          {item.ticket.name}
                        </strong>
                        <div className="booking-review__ticketUnits">
                          <span className="booking-review__ticketQuantity">
                            x{item.quantity}
                          </span>
                          <span className="booking-review__ticketUnitDot">•</span>
                          <span className="booking-review__ticketUnitPrice">
                            {formatBookingPrice(item.ticket.price)} / ticket
                          </span>
                        </div>
                      </div>

                      <div className="booking-review__ticketTotalBlock">
                        <small>Subtotal</small>
                        <strong className="booking-review__ticketTotal">
                          {formatBookingPrice(lineTotal)}
                        </strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR (30%) */}
          <aside className="booking-review__sidebar">
            <div className="booking-review__card booking-review__summaryCard">
              <h2>Booking Summary</h2>

              <div className="booking-review__summaryRows">
                <div className="booking-review__summaryRow">
                  <span>Ticket subtotal</span>
                  <strong>{formatBookingPrice(summary.totalPrice)}</strong>
                </div>

                <div className="booking-review__summaryRow">
                  <span>Fees</span>
                  <span className="booking-review__feesFree">0 đ</span>
                </div>

                <div className="booking-review__summaryDivider" />

                <div className="booking-review__summaryTotalRow">
                  <div>
                    <span>Total payment</span>
                    <small>All taxes included</small>
                  </div>
                  <strong>{formatBookingPrice(summary.totalPrice)}</strong>
                </div>
              </div>

              <button
                type="button"
                className="booking-review__checkoutBtn"
                onClick={() => navigate("/checkout")}
              >
                <span>Continue to checkout</span>
              </button>

              <button
                type="button"
                className="booking-review__modifyBtn"
                onClick={() => navigate(`/app/events/${eventId || event.encodedId}`)}
              >
                Modify tickets
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
