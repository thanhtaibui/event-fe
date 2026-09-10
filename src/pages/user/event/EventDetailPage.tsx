import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Crown,
  Gem,
  Heart,
  MapPin,
  Bookmark,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Star,
  Ticket,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

import { useEventById } from "../../../hooks/admin/event/useEventById";
import { useTicketTypeByIdEvent } from "../../../hooks/admin/event/useTicketTypes";
import { useEvents } from "../../../hooks/user/event/useEvents";
import { getAccessToken } from "../../../constants/authStorage";
import { userTicketService } from "../../../services/user/ticket.service";
import { triggerNotification } from "../../../hooks/notification/useNotificationTrigger";
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
  return events.filter((item) => item.id !== currentId).slice(0, 4);
}

type EventTicketType = TicketType & {
  total_quantity?: number;
  totalQuantity?: number;
  description?: string | null;
};

type TicketCartItem = {
  ticket: EventTicketType;
  quantity: number;
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

function formatTicketPrice(value?: number) {
  const price = Number(value ?? 0);
  if (price <= 0) return "Free";

  return `${new Intl.NumberFormat("vi-VN").format(price)} đ`;
}

function getTicketTotal(ticket: EventTicketType) {
  return ticket.total_quantity ?? ticket.totalQuantity ?? ticket.quantity;
}

function getCurrentUserId() {
  const token = getAccessToken();
  if (!token) return "";

  try {
    return jwtDecode<{ sub?: string }>(token).sub || "";
  } catch {
    return "";
  }
}

function getApiMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string | string[] } } })
      .response;
    const message = response?.data?.message;

    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
  }

  return fallback;
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<TicketCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  const realEventId = eventId ? decodeId(eventId) : "";
  const { data: rawEvent, loading } = useEventById(realEventId);
  const { data: rawTicketTypes, loading: ticketTypesLoading } =
    useTicketTypeByIdEvent(realEventId);
  const { events } = useEvents({ page: 1, limit: 8 });
  const event = getEventData(rawEvent);
  const ticketTypes = getTicketTypesData(rawTicketTypes);
  const relatedEvents = getRelatedEvents(events, event?.id || realEventId);

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

  const highlights = [
    {
      icon: UsersRound,
      title: `Organized by ${organizer || "Eventix partner"}`,
      text: "This event is hosted by an Eventix community.",
      action: organizerVerified ? "Verified Host" : "Community Host",
      tone: "verified",
    },
    {
      icon: Ticket,
      title: capacity ? `${available} spots available` : "Open capacity",
      text: capacity ? `from ${capacity} total capacity` : "Capacity is open for this event.",
      action: `${participants} / ${capacity || "Open"} registered`,
      tone: "capacity",
    },
    {
      icon: CalendarDays,
      title: "Registration closes",
      text: `on ${registrationEndDate}`,
      action: "Deadline",
      tone: "deadline",
    },
  ];

  const overviewItems = [
    {
      icon: UsersRound,
      label: "Hosted by",
      title: organizer || "Eventix partner",
      text: organizerVerified ? "Verified organizer" : "Community organizer",
      tone: "host",
    },
    {
      icon: UsersRound,
      label: "Participants",
      title: participants.toString(),
      text: participants ? "registered" : "Be the first to join!",
      tone: "participants",
    },
    {
      icon: Ticket,
      label: "Capacity",
      title: capacity ? capacity.toString() : "Open",
      text: capacity ? `spots available of ${capacity} total capacity` : "Flexible attendance",
      tone: "capacity",
    },
  ];

  const timeline = [
    {
      time: startTime,
      date: startDate,
      title: "Event starts",
      text: `${title || "This event"} begins at ${place || "the announced location"}.`,
      label: "Start",
      icon: Clock3,
      tone: "start",
    },
    {
      time: registrationEndDate,
      date: "",
      title: "Registration deadline",
      text: "Attendees should complete registration before this date.",
      label: "Deadline",
      icon: CalendarDays,
      tone: "deadline",
    },
    {
      time: endTime,
      date: startDate,
      title: "Event ends",
      text: "The published event time window closes.",
      label: "End",
      icon: Ticket,
      tone: "end",
    },
  ];

  const ticketIcons = [Star, Gem, Crown];
  const ticketTones = ["standard", "vip", "premium"] as const;
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotalPrice = cartItems.reduce(
    (total, item) => total + Number(item.ticket.price ?? 0) * item.quantity,
    0,
  );

  const handleSelectTicket = (ticketType: EventTicketType) => {
    const availableQuantity = Number(ticketType.quantity ?? 0);
    if (availableQuantity <= 0) return;

    setCartItems((items) => {
      const existingItem = items.find((item) => item.ticket.id === ticketType.id);
      if (existingItem) {
        return items.map((item) =>
          item.ticket.id === ticketType.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, availableQuantity),
              }
            : item,
        );
      }

      return [...items, { ticket: ticketType, quantity: 1 }];
    });
    toast.success(`${ticketType.name} added to cart`);
  };

  const updateCartQuantity = (ticketTypeId: string, nextQuantity: number) => {
    setCartItems((items) =>
      items
        .map((item) => {
          if (item.ticket.id !== ticketTypeId) return item;
          const availableQuantity = Number(item.ticket.quantity ?? 1);
          return {
            ...item,
            quantity: Math.min(Math.max(nextQuantity, 1), availableQuantity),
          };
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeCartItem = (ticketTypeId: string) => {
    setCartItems((items) => items.filter((item) => item.ticket.id !== ticketTypeId));
  };

  const handleSubmitOrder = async () => {
    if (!cartItems.length) {
      toast.warning("Please add at least one ticket to cart");
      return;
    }

    const userId = getCurrentUserId();
    if (!userId) {
      toast.error("Please login before buying tickets");
      navigate("/login");
      return;
    }

    try {
      setOrderLoading(true);
      const response = await userTicketService.createOrder({
        userId,
        items: cartItems.map((item) => ({
          ticketTypeId: item.ticket.id,
          quantity: item.quantity,
        })),
      });

      toast.success(response?.message || "Order created successfully");
      await triggerNotification("ORDER_CREATED", {
        eventTitle: title,
        count: cartItemCount,
        total: cartTotalPrice,
      });
      setCartItems([]);
      setCartOpen(false);
      navigate("/app/tickets");
    } catch (error) {
      toast.error(getApiMessage(error, "Could not create order"));
    } finally {
      setOrderLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="user-event-detail user-event-detail--loading">
        <div className="user-event-detail__skeletonHero">
          <span />
          <strong />
          <p />
          <div />
        </div>
        <section className="user-event-detail__layout user-event-detail__skeletonLayout">
          <div className="user-event-detail__main">
            <div className="user-event-detail__skeletonCard user-event-detail__skeletonCard--about" />
            <div className="user-event-detail__skeletonCard user-event-detail__skeletonCard--overview" />
            <div className="user-event-detail__skeletonCard user-event-detail__skeletonCard--timeline" />
            <div className="user-event-detail__tickets user-event-detail__skeletonTickets">
              <div className="user-event-detail__sectionHead">
                <div>
                  <span className="user-event-detail__skeletonLine user-event-detail__skeletonLine--eyebrow" />
                  <span className="user-event-detail__skeletonLine user-event-detail__skeletonLine--title" />
                  <span className="user-event-detail__skeletonLine user-event-detail__skeletonLine--copy" />
                </div>
                <span className="user-event-detail__skeletonLine user-event-detail__skeletonLine--button" />
              </div>
              <div className="user-event-detail__ticketGrid">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    className="user-event-detail__ticket user-event-detail__ticket--skeleton"
                    key={index}
                    aria-hidden="true"
                  >
                    <span />
                    <strong />
                    <i />
                    <i />
                    <button type="button" disabled />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <aside className="user-event-detail__aside user-event-detail__skeletonAside">
            <div className="user-event-detail__skeletonCard user-event-detail__skeletonCard--organizer" />
            <div className="user-event-detail__skeletonCard user-event-detail__skeletonCard--info" />
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="user-event-detail">
      <section className="user-event-detail__hero">
        <img src={getBanner(event)} alt={title} />
        <div className="user-event-detail__heroOverlay" />
        <div className="user-event-detail__heroContent">
          <div className="user-event-detail__badge">
            {status}
          </div>
          <h1>{title}</h1>
          <div className="user-event-detail__heroMeta">
            <span>
              <CalendarDays size={18} />
              {startDate} at {startTime}
            </span>
            <span>
              <MapPin size={18} />
              {place}
            </span>
          </div>
          <div className="user-event-detail__heroActions">
            <button type="button" className="user-event-detail__saveBtn">
              <Heart size={18} />
              Save
            </button>
            <button type="button" className="user-event-detail__shareBtn">
              <Share2 size={18} />
              Share
            </button>
            <a href="#tickets" className="user-event-detail__primaryBtn">
              Register Now
              <ArrowRight size={18} />
            </a>
          </div>
        </div>
      </section>

      <section className="user-event-detail__layout">
        <div className="user-event-detail__main">
          <article className="user-event-detail__card user-event-detail__about">
            <span className="user-event-detail__eyebrow">About event</span>
            <h2>{title}</h2>
            <p>{event?.description || "No event description has been added yet."}</p>
            <div className="user-event-detail__highlights">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                <div
                  className={`user-event-detail__highlight user-event-detail__highlight--${item.tone}`}
                  key={item.title}
                >
                  <span className="user-event-detail__highlightIcon">
                    <Icon size={26} />
                  </span>
                  <span className="user-event-detail__highlightDivider" />
                  <span className="user-event-detail__highlightCopy">
                    <strong>{item.title}</strong>
                    <small>{item.text}</small>
                  </span>
                  <span className="user-event-detail__highlightAction">
                    {item.tone === "verified" && organizerVerified && (
                      <ShieldCheck size={18} />
                    )}
                    {item.tone === "capacity" && <UsersRound size={18} />}
                    {item.tone === "deadline" && <Clock3 size={18} />}
                    {item.action}
                  </span>
                </div>
                );
              })}
            </div>
          </article>

          <article className="user-event-detail__card user-event-detail__overview">
            <span className="user-event-detail__eyebrow">Overview</span>
            <h2>Event overview</h2>
            <p>Key information about this event.</p>
            <div className="user-event-detail__overviewGrid">
              {overviewItems.map((item) => {
                const Icon = item.icon;
                return (
                <div className={`user-event-detail__overviewItem user-event-detail__overviewItem--${item.tone}`} key={item.label}>
                  <span className="user-event-detail__overviewIcon">
                    <Icon size={28} />
                  </span>
                  <span className="user-event-detail__overviewCopy">
                    <small>{item.label}</small>
                    <strong>{item.title}</strong>
                    <em>{item.text}</em>
                  </span>
                </div>
                );
              })}
            </div>
          </article>

          <article className="user-event-detail__card user-event-detail__timeline">
            <span className="user-event-detail__eyebrow user-event-detail__eyebrow--icon">
              <CalendarDays size={17} />
              Timeline
            </span>
            <h2>Event timeline</h2>
            <p>Important dates and times to keep in mind.</p>
            <div className="user-event-detail__timelineList user-event-detail__timelineList--split">
              {timeline.map((item) => {
                const Icon = item.icon;
                return (
                <div className={`user-event-detail__timelineItem user-event-detail__timelineItem--${item.tone}`} key={item.title}>
                  <div className="user-event-detail__timelineStamp">
                    <strong>{item.time}</strong>
                    {item.date && <span>{item.date}</span>}
                  </div>
                  <span className="user-event-detail__timelineMarker" />
                  <div className="user-event-detail__timelineCard">
                    <span className="user-event-detail__timelineIcon">
                      <Icon size={24} />
                    </span>
                    <div className="user-event-detail__timelineCopy">
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                    <span className="user-event-detail__timelineBadge">{item.label}</span>
                  </div>
                </div>
                );
              })}
            </div>
          </article>

          <section className="user-event-detail__tickets" id="tickets">
            <div className="user-event-detail__sectionHead">
              <div>
                <span className="user-event-detail__eyebrow">Tickets</span>
                <h2>Choose your ticket</h2>
                <p>Select the ticket that's right for you.</p>
              </div>
              <button
                type="button"
                className="user-event-detail__cartButton"
                onClick={() => setCartOpen(true)}
                disabled={!cartItems.length}
              >
                <ShoppingCart size={18} />
                View cart
                {cartItemCount > 0 && <span>{cartItemCount}</span>}
              </button>
            </div>
            <div className="user-event-detail__ticketGrid">
              {ticketTypesLoading && (
                <>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      className="user-event-detail__ticket user-event-detail__ticket--skeleton"
                      key={index}
                      aria-hidden="true"
                    >
                      <span />
                      <strong />
                      <i />
                      <i />
                      <button type="button" disabled />
                    </div>
                  ))}
                </>
              )}

              {!ticketTypesLoading && ticketTypes.length === 0 && (
                <div className="user-event-detail__ticketState">
                  No ticket types have been added yet.
                </div>
              )}

              {!ticketTypesLoading && ticketTypes.map((ticketType, index) => {
                const Icon = ticketIcons[index % ticketIcons.length];
                const tone = ticketTones[index % ticketTones.length];
                const quantity = Number(ticketType.quantity ?? 0);
                const total = Number(getTicketTotal(ticketType) ?? 0);
                const isSoldOut = quantity <= 0;

                return (
                <article
                  className={`user-event-detail__ticket user-event-detail__ticket--${tone}${
                    isSoldOut ? " user-event-detail__ticket--soldOut" : ""
                  }`}
                  key={ticketType.id}
                  aria-disabled={isSoldOut}
                >
                  <div className="user-event-detail__ticketHead">
                    <span className="user-event-detail__ticketIcon">
                      <Icon size={23} />
                    </span>
                    <span className="user-event-detail__ticketTitle">
                      <strong>{ticketType.name}</strong>
                      <small>{ticketType.description || "Event ticket type"}</small>
                    </span>
                    {isSoldOut ? <em>Sold Out</em> : index === 0 && <em>Available</em>}
                  </div>
                  <strong className="user-event-detail__ticketPrice">
                    {formatTicketPrice(ticketType.price)}
                  </strong>
                  <ul>
                    <li>
                      <Check size={16} />
                      Access to this event
                    </li>
                    <li>
                      <Check size={16} />
                      Ticket confirmation after checkout
                    </li>
                    <li>
                      <Check size={16} />
                      Event updates from organizer
                    </li>
                  </ul>
                  <div className="user-event-detail__ticketSeats">
                    <UsersRound size={17} />
                    <span>
                      {isSoldOut
                        ? "Sold out"
                        : total > 0
                          ? `${new Intl.NumberFormat("vi-VN").format(quantity)} / ${new Intl.NumberFormat("vi-VN").format(total)} left`
                          : `${new Intl.NumberFormat("vi-VN").format(quantity)} left`}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isSoldOut}
                    onClick={() => handleSelectTicket(ticketType)}
                  >
                    {isSoldOut ? "Sold Out" : "Add to cart"}
                  </button>
                </article>
                );
              })}
            </div>
            {cartItems.length > 0 && (
              <div className="user-event-detail__cartBar" role="status">
                <div>
                  <span>{cartItemCount} ticket{cartItemCount === 1 ? "" : "s"} in cart</span>
                  <strong>{formatTicketPrice(cartTotalPrice)}</strong>
                </div>
                <button type="button" onClick={() => setCartOpen(true)}>
                  <ShoppingCart size={17} />
                  Review & pay
                </button>
              </div>
            )}
            <div className="user-event-detail__secureNote">
              <ShieldCheck size={18} />
              <span>Secure checkout. Your payment is protected by our <strong>privacy policy</strong>.</span>
            </div>
          </section>
        </div>

        <aside className="user-event-detail__aside">
          <article className="user-event-detail__organizer user-event-detail__card">
            <div className="user-event-detail__orgAvatar">
              {organizer.charAt(0).toUpperCase()}
            </div>
            <div>
              <span>Organized by</span>
              <h3>
                {organizer || "Eventix partner"}
                <ShieldCheck size={20} />
              </h3>
              <p>Verified Eventix community host</p>
            </div>
          </article>

          <article className="user-event-detail__infoCard user-event-detail__card">
            <h3>Event information</h3>
            <div className="user-event-detail__infoRow">
              <CalendarDays size={17} />
              <span>Date</span>
              <strong>{startDate}</strong>
            </div>
            <div className="user-event-detail__infoRow">
              <Clock3 size={17} />
              <span>Time</span>
              <strong>{startTime} - {endTime}</strong>
            </div>
            <div className="user-event-detail__infoRow">
              <MapPin size={17} />
              <span>Location</span>
              <strong>{place}</strong>
            </div>
            <div className="user-event-detail__infoRow">
              <UsersRound size={17} />
              <span>Participants</span>
              <strong>{participants}/{capacity || "Open"}</strong>
            </div>
            <div className="user-event-detail__statusPill">
              {status}
            </div>
          </article>
        </aside>
      </section>

      <section className="user-event-detail__related">
        <div className="user-event-detail__sectionHead">
          <div>
            <span className="user-event-detail__eyebrow">Related events</span>
            <h2>You might also like</h2>
          </div>
          <Link to="/app/events">
            View all
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="user-event-detail__relatedTrack">
          {(relatedEvents.length ? relatedEvents : events.slice(0, 4)).map((item) => {
            const dateBadge = getDateBadge(item.startDateTime);
            return (
            <Link
              className="user-event-detail__relatedCard"
              to={`/app/events/${encodeId(item.id)}`}
              key={item.id}
            >
              <div className="user-event-detail__relatedMedia">
                <img src={getBanner(item)} alt={item.title} />
                <span className="user-event-detail__relatedDate">
                  <small>{dateBadge.month}</small>
                  <strong>{dateBadge.day}</strong>
                </span>
                <span className="user-event-detail__relatedSave" aria-hidden="true">
                  <Bookmark size={18} />
                </span>
              </div>
              <div className="user-event-detail__relatedBody">
                <span>{item.organization?.name || "Eventix"}</span>
                <strong>{item.title}</strong>
                <div className="user-event-detail__relatedMeta">
                  <small>
                    <CalendarDays size={15} />
                    {formatDate(item.startDateTime)}
                  </small>
                  <small>
                    <MapPin size={15} />
                    {item.place || "Online"}
                  </small>
                </div>
              </div>
            </Link>
            );
          })}
        </div>
      </section>

      {cartOpen && (
        <div className="user-event-detail__orderOverlay" role="presentation">
          <section
            className="user-event-detail__orderModal"
            aria-label="Ticket cart"
          >
            <button
              type="button"
              className="user-event-detail__orderClose"
              aria-label="Close cart"
              onClick={() => setCartOpen(false)}
            >
              ×
            </button>
            <span className="user-event-detail__eyebrow">Order</span>
            <h2>Review and confirm payment</h2>
            <p>
              Check ticket types and quantities before confirming your payment.
            </p>

            <div className="user-event-detail__orderSummary">
              <div>
                <small>Event</small>
                <strong>{title || "Selected event"}</strong>
                <span>{place || "Location to be announced"}</span>
              </div>
              <div>
                <small>Cart</small>
                <strong>{cartItemCount} ticket{cartItemCount === 1 ? "" : "s"}</strong>
                <span>{cartItems.length} type{cartItems.length === 1 ? "" : "s"} selected</span>
              </div>
            </div>

            <div className="user-event-detail__cartList">
              {cartItems.length === 0 ? (
                <div className="user-event-detail__cartEmpty">
                  Your cart is empty.
                </div>
              ) : (
                cartItems.map((item) => {
                  const availableQuantity = Number(item.ticket.quantity ?? 1);

                  return (
                    <article className="user-event-detail__cartItem" key={item.ticket.id}>
                      <div>
                        <strong>{item.ticket.name}</strong>
                        <span>{formatTicketPrice(item.ticket.price)}</span>
                      </div>
                      <div className="user-event-detail__cartStepper">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.ticket.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || orderLoading}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={availableQuantity || 1}
                          value={item.quantity}
                          onChange={(event) =>
                            updateCartQuantity(
                              item.ticket.id,
                              Number(event.target.value) || 1,
                            )
                          }
                          disabled={orderLoading}
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.ticket.id, item.quantity + 1)}
                          disabled={item.quantity >= (availableQuantity || 1) || orderLoading}
                        >
                          +
                        </button>
                      </div>
                      <strong className="user-event-detail__cartLineTotal">
                        {formatTicketPrice(Number(item.ticket.price ?? 0) * item.quantity)}
                      </strong>
                      <button
                        type="button"
                        className="user-event-detail__cartRemove"
                        onClick={() => removeCartItem(item.ticket.id)}
                        disabled={orderLoading}
                        aria-label={`Remove ${item.ticket.name}`}
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  );
                })
              )}
            </div>

            <div className="user-event-detail__orderTotal">
              <span>Total</span>
              <strong>{formatTicketPrice(cartTotalPrice)}</strong>
            </div>

            <button
              type="button"
              className="user-event-detail__orderSubmit"
              onClick={handleSubmitOrder}
              disabled={orderLoading || !cartItems.length}
            >
              {orderLoading ? "Creating order..." : "Confirm payment"}
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
