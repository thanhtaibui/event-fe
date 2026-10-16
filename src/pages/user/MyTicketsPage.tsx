import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MoreVertical,
  Search,
  SearchX,
  ShieldCheck,
  Tag,
  Ticket,
  X,
} from "lucide-react";

import { useMyTickets } from "../../hooks/user/myticket/useMyTickets";
import type { GroupedOrder } from "../../data/user/myTickets";

import "../../styles/user/myticket/myTickets.css";

type FilterTab = "UPCOMING" | "PAST";
type SortKey = "featured" | "date";

function formatPrice(price?: number) {
  if (price === undefined || price === null || isNaN(price)) return null;
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
}

function OrderCardItem({
  order,
  onSelectOrder,
}: {
  order: GroupedOrder;
  onSelectOrder: (order: GroupedOrder) => void;
}) {
  const [imageError, setImageError] = useState(false);
  const isUpcoming = order.status === "UPCOMING";
  const statusLabel = isUpcoming ? "VALID" : "USED";
  const statusClass = isUpcoming ? "valid" : "used";

  const bannerUrl = order.eventBannerUrl;
  const showFallback = !bannerUrl || imageError;
  const displayTitle = order.eventName;

  return (
    <article
      className={`myTicketOrderCard myTicketOrderCard--${statusClass}`}
      key={order.orderId}
      aria-label={displayTitle}
    >
      <div className="myTicketOrderCard__accentLine" />

      {/* LEFT: Event banner image (140x90px, border-radius: 14px, object-fit: cover) / Fallback */}
      <div
        className={`myTicketOrderCard__thumbWrap ${showFallback ? "myTicketOrderCard__thumbWrap--fallback" : ""}`}
      >
        {!showFallback ? (
          <img
            src={bannerUrl}
            alt={displayTitle}
            className="myTicketOrderCard__thumb"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="myTicketOrderCard__fallback" aria-hidden="true">
            <Ticket size={28} className="myTicketOrderCard__fallbackIcon" />
          </div>
        )}
      </div>

      {/* CENTER: Event and Order Information */}
      <div className="myTicketOrderCard__center">
        <div className="myTicketOrderCard__titleGroup">
          <h2 title={displayTitle}>{displayTitle}</h2>
          <span className="myTicketOrderCard__countBadge">
            <Ticket size={12} aria-hidden="true" />
            <span>
              {order.totalTickets} {order.totalTickets === 1 ? "ticket" : "tickets"}
            </span>
          </span>
        </div>

        {/* Ticket Types breakdown: e.g. VIP Supporter ×1, Standard ×2 */}
        <div className="myTicketOrderCard__types">
          {order.ticketTypeBreakdown.map((item, idx) => {
            const isVip = item.name.toLowerCase().includes("vip");
            const isEarly = item.name.toLowerCase().includes("early");
            const chipClass = isVip ? "vip" : isEarly ? "early" : "standard";
            return (
              <span
                key={idx}
                className={`myTicketOrderCard__typeChip myTicketOrderCard__typeChip--${chipClass}`}
              >
                {item.name} ×{item.count}
              </span>
            );
          })}
        </div>

        {/* Meta row: Date, Location, Organizer, Order Total Price */}
        <div className="myTicketOrderCard__meta">
          <span className="myTicketOrderCard__metaItem">
            <CalendarDays size={14} aria-hidden="true" />
            <span>
              {order.date.weekday}, {order.date.month} {order.date.day} • 19:00 - 22:00
            </span>
          </span>

          <span className="myTicketOrderCard__metaItem">
            <MapPin size={14} aria-hidden="true" />
            <span>{order.location}</span>
          </span>

          {order.organizationName && (
            <span className="myTicketOrderCard__metaItem">
              <Building2 size={14} aria-hidden="true" />
              <span>{order.organizationName}</span>
            </span>
          )}

          {order.totalPrice !== undefined && (
            <span className="myTicketOrderCard__metaItem myTicketOrderCard__metaItem--price">
              <Tag size={13} aria-hidden="true" />
              <span>{formatPrice(order.totalPrice)}</span>
            </span>
          )}
        </div>
      </div>

      {/* RIGHT: Status Badge & Primary Action */}
      <div className="myTicketOrderCard__right">
        <span className={`myTicketStatus myTicketStatus--${statusClass}`}>
          {statusLabel}
        </span>

        <div className="myTicketOrderCard__actions">
          <button
            type="button"
            className="myTicketOrderCard__viewBtn"
            onClick={() => onSelectOrder(order)}
          >
            <span>View tickets</span>
            <ArrowRight size={14} aria-hidden="true" />
          </button>

          <button
            type="button"
            className="myTicketOrderCard__moreBtn"
            aria-label="More options"
          >
            <MoreVertical size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MyTicketsPage() {
  const [tab, setTab] = useState<FilterTab>("UPCOMING");
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<GroupedOrder | null>(null);

  useEffect(() => {
    if (selectedOrder) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [selectedOrder]);

  const { orders, summary, upcomingNext, loading, error } = useMyTickets();

  const upcomingCount = useMemo(
    () => orders.filter((o) => o.status === "UPCOMING").length,
    [orders]
  );
  const pastCount = useMemo(
    () => orders.filter((o) => o.status === "PAST").length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const list = orders.filter((order) => {
      const matchesTab = order.status === tab;
      if (!normalizedQuery) return matchesTab;

      const typesString = order.ticketTypeBreakdown.map((t) => t.name).join(" ");
      return (
        matchesTab &&
        [
          order.eventName,
          order.organizationName,
          order.location,
          order.orderId,
          typesString,
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });

    if (sortBy === "date") {
      return [...list].reverse();
    }

    return list;
  }, [query, tab, sortBy, orders]);

  const stats = [
    {
      label: "Total tickets",
      value: summary.total,
      icon: Ticket,
      color: "purple",
    },
    {
      label: "Upcoming events",
      value: summary.upcoming,
      icon: Calendar,
      color: "blue",
    },
    {
      label: "Used tickets",
      value: summary.past,
      icon: CheckCircle2,
      color: "green",
    },
  ];

  const renderOrderCard = (order: GroupedOrder) => (
    <OrderCardItem
      key={order.orderId}
      order={order}
      onSelectOrder={setSelectedOrder}
    />
  );

  return (
    <main className="myTicketsPage">
      <div className="myTicketsPage__container">
        {/* 1. HERO HEADER SECTION */}
        <header className="myTicketsHeader" aria-label="Ticket wallet header">
          <div className="myTicketsHeader__glow" aria-hidden="true" />
          <div className="myTicketsHeader__left">
            <div className="myTicketsEyebrow">
              <Ticket size={13} aria-hidden="true" />
              <span>DIGITAL TICKET WALLET</span>
            </div>
            <div className="myTicketsHeader__titleRow">
              <h1>My Tickets</h1>
              <span className="myTicketsBadgeCount">
                {summary.total} {summary.total === 1 ? "ticket" : "tickets"}
              </span>
            </div>
            <p className="myTicketsHeader__subtitle">
              Manage your booked events, access tickets, and review booking details.
            </p>
          </div>

          <div className="myTicketsHeader__right" aria-hidden="true">
            <div className="myTicketsHeroVisual">
              <img
                src="/bg-ticket.png"
                alt="Digital Event Pass"
                className="myTicketsHeroImage"
              />
            </div>
          </div>
        </header>

        {/* 2. STATISTICS CARDS */}
        <section className="myTicketsStats" aria-label="Ticket statistics">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <article
                className={`myTicketsStat myTicketsStat--${item.color}`}
                key={item.label}
              >
                <span className="myTicketsStat__iconWrap">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <div className="myTicketsStat__content">
                  <strong>{item.value}</strong>
                  <small>{item.label}</small>
                </div>
              </article>
            );
          })}
        </section>

        {/* 3. FILTER TOOLBAR */}
        <section className="myTicketsToolbar" aria-label="Ticket controls">
          <div
            className="myTicketsTabs"
            role="tablist"
            aria-label="Upcoming or used tickets"
          >
            <button
              type="button"
              className={`myTicketsTab ${tab === "UPCOMING" ? "myTicketsTab--active" : ""}`}
              onClick={() => setTab("UPCOMING")}
              role="tab"
              aria-selected={tab === "UPCOMING"}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              type="button"
              className={`myTicketsTab ${tab === "PAST" ? "myTicketsTab--active" : ""}`}
              onClick={() => setTab("PAST")}
              role="tab"
              aria-selected={tab === "PAST"}
            >
              Used ({pastCount})
            </button>
          </div>

          <div className="myTicketsToolbar__right">
            <label className="myTicketsSearch" aria-label="Search tickets">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by event, organizer or place"
              />
            </label>

            <label className="myTicketsSort">
              <span>Sort</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as SortKey)}
              >
                <option value="featured">Featured</option>
                <option value="date">Date</option>
              </select>
            </label>
          </div>
        </section>

        {error && <div className="myTicketsNotice">{error}</div>}

        {/* HORIZONTAL ORDER CARDS LIST / LOADING / EMPTY STATE */}
        {loading ? (
          <section className="myTicketsList" aria-label="Loading tickets">
            {Array.from({ length: 4 }).map((_, index) => (
              <div className="myTicketOrderCard myTicketOrderCard--skeleton" key={index} />
            ))}
          </section>
        ) : filteredOrders.length ? (
          <section className="myTicketsList" aria-label="Orders list">
            {filteredOrders.map(renderOrderCard)}
          </section>
        ) : !orders.length ? (
          <section className="myTicketsEmpty" aria-label="No tickets">
            <div className="myTicketsEmpty__icon">
              <Ticket size={48} aria-hidden="true" />
            </div>
            <h2>No tickets yet</h2>
            <p>Your purchased tickets will appear here.</p>
            <Link to="/app/events" className="myTicketsEmpty__btn">
              <span>Explore events</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
        ) : (
          <section className="myTicketsEmpty" aria-label="No tickets found">
            <div className="myTicketsEmpty__icon">
              <SearchX size={44} aria-hidden="true" />
            </div>
            <h2>No tickets found</h2>
            <p>Try another status tab or search keyword.</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="myTicketsEmpty__btn"
            >
              Clear search
            </button>
          </section>
        )}

        {/* ASSIST / SUPPORT FOOTER */}
        <section className="myTicketsAssist" aria-label="Ticket support">
          <article>
            <span>
              <Clock3 size={18} aria-hidden="true" />
            </span>
            <div>
              <small>Upcoming next</small>
              <strong>{upcomingNext.eventName}</strong>
              <p>
                {upcomingNext.dateLabel} with {upcomingNext.organizationName}
              </p>
            </div>
          </article>
          <article>
            <span>
              <ShieldCheck size={18} aria-hidden="true" />
            </span>
            <div>
              <small>Secure ticket wallet</small>
              <strong>QR codes stay ready</strong>
              <p>Click View tickets to reveal your check-in QR code.</p>
            </div>
          </article>
        </section>
      </div>

      {/* TICKET WALLET MODAL (CLICK VIEW TICKETS) */}
      {selectedOrder &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="myTicketModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-ticket-title"
          >
            <div
              className="myTicketModal__backdrop"
              onClick={() => setSelectedOrder(null)}
              aria-hidden="true"
            />
            <div
              className={`myTicketModal__dialog ${selectedOrder.totalTickets > 1 ? "myTicketModal__dialog--multi" : ""}`}
            >
              {/* MODAL HEADER: Event name + tickets count */}
              <div className="myTicketWallet__header">
                <div className="myTicketWallet__headerTitles">
                  <h3 id="modal-ticket-title">{selectedOrder.eventName}</h3>
                  <span className="myTicketWallet__countBadge">
                    {selectedOrder.totalTickets} {selectedOrder.totalTickets === 1 ? "ticket" : "tickets"}
                  </span>
                </div>
                <button
                  type="button"
                  className="myTicketWallet__closeBtn"
                  onClick={() => setSelectedOrder(null)}
                  aria-label="Close ticket wallet"
                >
                  <X size={16} />
                </button>
              </div>

              {/* MODAL BODY */}
              <div className="myTicketWallet__body">
                {/* TICKETS LIST INSIDE ORDER */}
                <div className="myTicketWallet__ticketList">
                  {selectedOrder.tickets.map((ticket, index) => {
                    const ticketTypeName =
                      ticket.ticketType?.name || ticket.shortDescription || "Standard";
                    const isMulti = selectedOrder.totalTickets > 1;
                    const qrSize = isMulti ? 112 : 132;

                    return (
                      <div className="myTicketWallet__ticketItem" key={ticket.id || index}>
                        <div className="myTicketWallet__ticketHeader">
                          <span className="myTicketWallet__ticketNumber">
                            Ticket {index + 1}
                          </span>
                          <span className="myTicketWallet__ticketType">
                            {ticketTypeName}
                          </span>
                        </div>

                        {/* QR CODE FOR THIS SPECIFIC TICKET (ticket.id encoded, no UUID text displayed) */}
                        <div
                          className={`myTicketWallet__qrWrap ${isMulti ? "myTicketWallet__qrWrap--multi" : "myTicketWallet__qrWrap--single"}`}
                        >
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&margin=3&data=${encodeURIComponent(ticket.id)}`}
                            alt={`QR Code for Ticket ${index + 1}`}
                            className="myTicketWallet__qrImage"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (!target.dataset.fallback) {
                                target.dataset.fallback = "true";
                                target.src = `https://quickchart.io/qr?text=${encodeURIComponent(ticket.id)}&size=${qrSize}`;
                              }
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* EVENT INFORMATION SUMMARY */}
                <div className="myTicketWallet__summary">
                  <div className="myTicketWallet__summaryItem">
                    <CalendarDays size={13} aria-hidden="true" />
                    <span>
                      {selectedOrder.date.weekday}, {selectedOrder.date.month} {selectedOrder.date.day} • 19:00 - 22:00
                    </span>
                  </div>

                  <div className="myTicketWallet__summaryItem">
                    <MapPin size={13} aria-hidden="true" />
                    <span>{selectedOrder.location}</span>
                  </div>

                  {selectedOrder.organizationName && (
                    <div className="myTicketWallet__summaryItem">
                      <Building2 size={13} aria-hidden="true" />
                      <span>{selectedOrder.organizationName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div className="myTicketWallet__footer">
                <button
                  type="button"
                  className="myTicketWallet__doneBtn"
                  onClick={() => setSelectedOrder(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </main>
  );
}
