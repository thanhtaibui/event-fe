import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Clock3,
  Heart,
  MapPin,
  Minus,
  Plus,
  Bookmark,
  Share2,
  ShoppingCart,
  Tag,
  Ticket,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useEventById } from "../../../hooks/admin/event/useEventById";
import { useTicketTypeByIdEvent } from "../../../hooks/admin/event/useTicketTypes";
import { useEvents } from "../../../hooks/user/event/useEvents";
import {
  formatBookingPrice,
  useBookingCart,
} from "../../../contexts/BookingCartContext";
import type { EventDto } from "../../../types/event/event";
import type { TicketType } from "../../../types/ticket-type/ticket-type";
import { decodeId, encodeId } from "../../../utils/hash";

import "../../../styles/user/event/eventDetail.css";

function getEventData(raw: unknown): EventDto | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as { data?: EventDto } & EventDto;
  return value.data || value;
}

function getBanner(event?: EventDto | null) {
  return event?.eventBanner || "/default-banner.png";
}

function formatDate(value?: string | Date) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTime(value?: string | Date) {
  if (!value) return "TBA";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateBadge(value?: string | Date) {
  if (!value) return { month: "TBA", day: "--" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { month: "TBA", day: "--" };
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: date.toLocaleDateString("en-US", { day: "2-digit" }),
  };
}

function getStatusLabel(status?: string) {
  return status ? status.toString() : "Upcoming";
}

function getRelatedEvents(events: EventDto[], currentId?: string) {
  return events.filter((item) => item.id !== currentId).slice(0, 3);
}

type EventTicketType = TicketType & {
  total_quantity?: number;
  totalQuantity?: number;
  description?: string | null;
};

function getTicketTypesData(raw: unknown): EventTicketType[] {
  if (Array.isArray(raw)) return raw as EventTicketType[];
  if (!raw || typeof raw !== "object") return [];

  const value = raw as {
    data?: EventTicketType[] | { items?: EventTicketType[] };
    items?: EventTicketType[];
  };

  if (Array.isArray(value.data)) return value.data;
  if (value.data && "items" in value.data && Array.isArray(value.data.items)) {
    return value.data.items;
  }
  if (Array.isArray(value.items)) return value.items;

  return [];
}


export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [ticketQuantities, setTicketQuantities] = useState<Record<string, number>>({});
  const { addTicket, getItemsForEvent, getItemQuantity, isCartOpen, openCart } =
    useBookingCart();
  const realEventId = eventId ? decodeId(eventId) : "";
  const { data: rawEvent, loading } = useEventById(realEventId);
  const { data: rawTicketTypes, loading: ticketTypesLoading } =
    useTicketTypeByIdEvent(realEventId);
  const { events } = useEvents({ page: 1, limit: 8 });
  const event = getEventData(rawEvent);
  const ticketTypes = getTicketTypesData(rawTicketTypes);
  const currentEventId = event?.id || realEventId;
  const relatedEvents = getRelatedEvents(events, currentEventId);

  const title = event?.title || "";
  const organizer = event?.organization?.name || "";
  const organizerVerified = Boolean(
    event?.organization?.isVerified || event?.organization?.isve,
  );
  const place = event?.place || "";
  const startDate = formatDate(event?.startDateTime);
  const startTime = formatTime(event?.startDateTime);
  const endTime = formatTime(event?.endDateTime);
  const registrationEndDate = formatDate(event?.registrationEndDate);
  const participants = event?.soldTickets || 0;
  const capacity = event?.capacity || 0;
  const available = Math.max(capacity - participants, 0);
  const status = getStatusLabel(event?.status);

  const stepperItems = [
    {
      title: "Registration deadline",
      dateTime: registrationEndDate,
      description: "Complete your ticket reservation before registration closes.",
      icon: CalendarDays,
    },
    {
      title: "Event starts",
      dateTime: `${startDate} • ${startTime}`,
      description: `${title || "This event"} officially begins at ${place || "the announced location"}.`,
      icon: Clock3,
    },
    {
      title: "Event ends",
      dateTime: `${startDate} • ${endTime}`,
      description: "The published experience session concludes.",
      icon: Ticket,
    },
    {
      title: "Location & venue",
      dateTime: place || "Location to be announced",
      description: "Venue access, arrival check-in and on-site event support.",
      icon: MapPin,
    },
  ];

  const eventCartItems = getItemsForEvent(currentEventId);
  const cartItemCount = eventCartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotalPrice = eventCartItems.reduce(
    (total, item) => total + Number(item.ticket.price ?? 0) * item.quantity,
    0,
  );

  useEffect(() => {
    if (!isCartOpen) {
      setTicketQuantities({});
    }
  }, [isCartOpen]);

  const getDraftQuantity = (ticketType: EventTicketType) => {
    const availableQuantity = Number(ticketType.quantity ?? 0);
    if (availableQuantity <= 0) return 0;

    if (ticketQuantities[ticketType.id] !== undefined) {
      return ticketQuantities[ticketType.id];
    }

    const inCartQty = currentEventId
      ? getItemQuantity(currentEventId, ticketType.id)
      : 0;

    if (inCartQty > 0) {
      return Math.min(inCartQty, availableQuantity);
    }

    return 1;
  };

  const updateDraftQuantity = (ticketType: EventTicketType, nextQuantity: number) => {
    const availableQuantity = Number(ticketType.quantity ?? 0);
    const safeQuantity = Math.min(Math.max(nextQuantity, 0), availableQuantity);

    setTicketQuantities((current) => ({
      ...current,
      [ticketType.id]: safeQuantity,
    }));
  };

  const handleAddTicket = (ticketType: EventTicketType) => {
    if (!event) return;

    const quantity = getDraftQuantity(ticketType);
    if (quantity <= 0) return;

    addTicket(
      {
        id: event.id,
        encodedId: eventId || encodeId(event.id),
        title: title || "Selected event",
        place,
        startDateTime: event.startDateTime,
        eventBanner: event.eventBanner,
        organizationName: organizer,
      },
      ticketType,
      quantity,
    );

    setTicketQuantities((current) => {
      const next = { ...current };
      delete next[ticketType.id];
      return next;
    });

    toast.success("Added to cart");
  };

  if (loading) {
    return (
      <main className="user-event-detail user-event-detail--loading" aria-busy="true">
        <section className="user-event-detail__skeletonHero" />
        <section className="user-event-detail__layout user-event-detail__skeletonLayout">
          <div className="user-event-detail__main">
            <div className="user-event-detail__skeletonBlock user-event-detail__skeletonBlock--wide" />
            <div className="user-event-detail__skeletonBlock" />
            <div className="user-event-detail__skeletonBlock" />
          </div>
          <aside className="user-event-detail__bookingPanel user-event-detail__bookingPanel--skeleton" />
        </section>
      </main>
    );
  }

  return (
    <main className="user-event-detail">
      <section className="user-event-detail__hero" aria-label="Event overview">
        <div className="user-event-detail__heroMedia">
          <img src={getBanner(event)} alt={title || "Event banner"} />
        </div>
        <div className="user-event-detail__heroOverlay" />
        <div className="user-event-detail__heroContent">
          <button
            type="button"
            className="user-event-detail__backLink"
            onClick={() => navigate("/app/events")}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to events
          </button>
          <span className="user-event-detail__badge">{status}</span>
          <h1>{title || "Event detail"}</h1>
          <div className="user-event-detail__heroMeta">
            <span>
              <CalendarDays size={18} aria-hidden="true" />
              {startDate}
            </span>
            <span>
              <Clock3 size={18} aria-hidden="true" />
              {startTime}
            </span>
            <span>
              <MapPin size={18} aria-hidden="true" />
              {place || "Location to be announced"}
            </span>
          </div>
          <div className="user-event-detail__heroActions">
            <a href="#tickets" className="user-event-detail__primaryBtn">
              Choose tickets
              <ArrowRight size={18} aria-hidden="true" />
            </a>
            <button type="button" className="user-event-detail__iconBtn">
              <Heart size={18} aria-hidden="true" />
              Save
            </button>
            <button type="button" className="user-event-detail__iconBtn">
              <Share2 size={18} aria-hidden="true" />
              Share
            </button>
          </div>
        </div>
      </section>

      <section className="user-event-detail__layout">
        <div className="user-event-detail__main">
          {/* 1. About this event */}
          <section className="user-event-detail__card user-event-detail__aboutCard">
            <div className="user-event-detail__cardHead">
              <span className="user-event-detail__eyebrow">Overview</span>
              <h2>About this event</h2>
            </div>
            <div className="user-event-detail__description">
              <p>{event?.description || "No event description has been added yet."}</p>
            </div>

            <div className="user-event-detail__highlightsGrid" aria-label="Event Highlights">
              <div className="user-event-detail__highlightItem">
                <span className="user-event-detail__highlightIcon">
                  <Tag size={18} aria-hidden="true" />
                </span>
                <div>
                  <small>Category</small>
                  <strong>{event?.categories?.[0]?.name || "General Event"}</strong>
                </div>
              </div>

              <div className="user-event-detail__highlightItem">
                <span className="user-event-detail__highlightIcon">
                  <Building2 size={18} aria-hidden="true" />
                </span>
                <div>
                  <small>Organization</small>
                  <strong className="user-event-detail__orgHighlight">
                    <span>{organizer || "Eventix Partner"}</span>
                    {organizerVerified && <BadgeCheck size={16} aria-label="Verified" />}
                  </strong>
                </div>
              </div>

              <div className="user-event-detail__highlightItem">
                <span className="user-event-detail__highlightIcon">
                  <MapPin size={18} aria-hidden="true" />
                </span>
                <div>
                  <small>Location</small>
                  <strong>{place || "Location to be announced"}</strong>
                </div>
              </div>

              <div className="user-event-detail__highlightItem">
                <span className="user-event-detail__highlightIcon">
                  <UsersRound size={18} aria-hidden="true" />
                </span>
                <div>
                  <small>Capacity</small>
                  <strong>
                    {capacity
                      ? `${new Intl.NumberFormat("vi-VN").format(capacity)} total (${new Intl.NumberFormat("vi-VN").format(available)} left)`
                      : "Open capacity"}
                  </strong>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Event timeline / plan: Vertical Stepper UI */}
          <section className="user-event-detail__card user-event-detail__timelineCard">
            <div className="user-event-detail__cardHead">
              <span className="user-event-detail__eyebrow">Timeline</span>
              <h2>Event schedule & plan</h2>
            </div>

            <div className="user-event-detail__stepper" aria-label="Event timeline steps">
              {stepperItems.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div className="user-event-detail__stepperItem" key={step.title}>
                    <div className="user-event-detail__stepperTrack">
                      <span className="user-event-detail__stepperDot">
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      {index < stepperItems.length - 1 && (
                        <span className="user-event-detail__stepperLine" aria-hidden="true" />
                      )}
                    </div>
                    <div className="user-event-detail__stepperContent">
                      <div className="user-event-detail__stepperHead">
                        <strong>{step.title}</strong>
                        <time className="user-event-detail__stepperTime">{step.dateTime}</time>
                      </div>
                      <p>{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Related events */}
          <section className="user-event-detail__card user-event-detail__relatedCardSection">
            <div className="user-event-detail__cardHead user-event-detail__relatedHead">
              <div>
                <span className="user-event-detail__eyebrow">Explore more</span>
                <h2>Related events</h2>
              </div>
              <Link to="/app/events" className="user-event-detail__viewAllLink">
                View all
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="user-event-detail__relatedGrid">
              {(relatedEvents.length ? relatedEvents : events.slice(0, 3)).map((item) => {
                const dateBadge = getDateBadge(item.startDateTime);
                return (
                  <Link
                    className="user-event-detail__relatedCard"
                    to={`/app/events/${encodeId(item.id)}`}
                    key={item.id}
                  >
                    <div className="user-event-detail__relatedMedia">
                      <img src={getBanner(item)} alt={item.title} loading="lazy" />
                      <span className="user-event-detail__relatedDate">
                        <small>{dateBadge.month}</small>
                        <strong>{dateBadge.day}</strong>
                      </span>
                      <span className="user-event-detail__relatedSave" aria-hidden="true">
                        <Bookmark size={16} />
                      </span>
                    </div>
                    <div className="user-event-detail__relatedBody">
                      <span>{item.organization?.name || "Eventix"}</span>
                      <strong>{item.title}</strong>
                      <div className="user-event-detail__relatedMeta">
                        <small>
                          <CalendarDays size={14} aria-hidden="true" />
                          {formatDate(item.startDateTime)}
                        </small>
                        <small>
                          <MapPin size={14} aria-hidden="true" />
                          {item.place || "Online"}
                        </small>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* RIGHT SIDEBAR (30%) */}
        <aside className="user-event-detail__sidebar" id="tickets">
          {/* 1. Ticket selection */}
          <div className="user-event-detail__card user-event-detail__ticketSection">
            <div className="user-event-detail__ticketHeader">
              <span className="user-event-detail__eyebrow">Tickets</span>
              <h2>Select tickets</h2>
              <p>Choose your ticket tier and add to cart to proceed.</p>
            </div>

            <div className="user-event-detail__ticketList">
              {ticketTypesLoading &&
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    className="user-event-detail__ticketCard user-event-detail__ticketCard--skeleton"
                    key={index}
                    aria-hidden="true"
                  />
                ))}

              {!ticketTypesLoading && ticketTypes.length === 0 && (
                <div className="user-event-detail__ticketEmpty">
                  No ticket types available for this event.
                </div>
              )}

              {!ticketTypesLoading &&
                ticketTypes.map((ticketType) => {
                  const quantity = Number(ticketType.quantity ?? 0);
                  const isSoldOut = quantity <= 0;
                  const draftQty = getDraftQuantity(ticketType);

                  return (
                    <article
                      className={`user-event-detail__ticketCard${
                        isSoldOut ? " user-event-detail__ticketCard--soldOut" : ""
                      }`}
                      key={ticketType.id}
                      aria-disabled={isSoldOut}
                    >
                      {/* ROW 1: Name + Available badge, Price */}
                      <div className="user-event-detail__ticketRowTop">
                        <div className="user-event-detail__ticketHeaderLine">
                          <strong className="user-event-detail__ticketName">
                            {ticketType.name}
                          </strong>
                          <span
                            className={`user-event-detail__ticketBadge${
                              isSoldOut ? " user-event-detail__ticketBadge--soldOut" : ""
                            }`}
                          >
                            {isSoldOut ? "Sold out" : "Available"}
                          </span>
                        </div>
                        <strong className="user-event-detail__ticketPrice">
                          {formatBookingPrice(ticketType.price)}
                        </strong>
                      </div>

                      {/* ROW 2: [-] 1 [+] and Add ticket */}
                      <div className="user-event-detail__ticketRowBottom">
                        <div
                          className="user-event-detail__stepperCompact"
                          aria-label="Quantity selector"
                        >
                          <button
                            type="button"
                            disabled={isSoldOut || draftQty <= 0}
                            onClick={() =>
                              updateDraftQuantity(ticketType, draftQty - 1)
                            }
                            aria-label={`Decrease ${ticketType.name}`}
                          >
                            <Minus size={13} aria-hidden="true" />
                          </button>
                          <span>{draftQty}</span>
                          <button
                            type="button"
                            disabled={isSoldOut || draftQty >= quantity}
                            onClick={() =>
                              updateDraftQuantity(ticketType, draftQty + 1)
                            }
                            aria-label={`Increase ${ticketType.name}`}
                          >
                            <Plus size={13} aria-hidden="true" />
                          </button>
                        </div>

                        <button
                          type="button"
                          className="user-event-detail__addTicketBtn"
                          disabled={isSoldOut || draftQty <= 0}
                          onClick={() => handleAddTicket(ticketType)}
                        >
                          {isSoldOut ? "Sold out" : "Add ticket"}
                        </button>
                      </div>

                      {/* Remaining Quantity: Small muted text at bottom right */}
                      {!isSoldOut && (
                        <div className="user-event-detail__ticketSeats">
                          {new Intl.NumberFormat("vi-VN").format(quantity)} seats left
                        </div>
                      )}
                    </article>
                  );
                })}
            </div>
          </div>

          {/* 2. Cart summary */}
          <div className="user-event-detail__cartSummaryBox" role="status">
            <div className="user-event-detail__cartSummaryHead">
              <div>
                <small className="user-event-detail__cartLabel">Your tickets</small>
                <strong>
                  {cartItemCount} ticket{cartItemCount === 1 ? "" : "s"} selected
                </strong>
              </div>
              <div className="user-event-detail__cartTotalWrapper">
                <small>Total</small>
                <strong className="user-event-detail__cartTotalValue">
                  {formatBookingPrice(cartTotalPrice)}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="user-event-detail__viewCartBtn"
              onClick={openCart}
              disabled={!eventCartItems.length}
            >
              <ShoppingCart size={16} aria-hidden="true" />
              View Cart
            </button>
          </div>
        </aside>
      </section>

    </main>
  );
}
