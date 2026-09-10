import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  MoreHorizontal,
  QrCode,
  Ticket,
} from "lucide-react";
import type { MyTicket } from "../../../data/user/myTickets";

type Props = {
  ticket: MyTicket;
};

export default function MyTicketCard({ ticket }: Props) {
  const isUpcoming = ticket.status === "UPCOMING";
  const ticketCode = `#EVX-${ticket.id.replace(/\D/g, "").padEnd(6, "0")}`;

  return (
    <article
      className="myTicketCard"
      aria-label={`Ticket for ${ticket.eventName}`}
    >
      <div className="myTicketCard__left">
        <div className="myTicketCard__eventImageWrap">
          <img
            className="myTicketCard__eventImage"
            src={ticket.imageUrl}
            alt={ticket.eventName}
          />
          <span
            className={`myTicketCard__statusTag ${
              isUpcoming
                ? "myTicketCard__statusTag--upcoming"
                : "myTicketCard__statusTag--past"
            }`}
          >
            {isUpcoming ? "Upcoming" : "Past"}
          </span>
        </div>

        <div className="myTicketCard__dateBadge" aria-label="Ticket date">
          <div className="myTicketCard__dateMonth">{ticket.date.month}</div>
          <div className="myTicketCard__dateDay">{ticket.date.day}</div>
          <div className="myTicketCard__dateWeekday">{ticket.date.weekday}</div>
        </div>

        <div className="myTicketCard__textInfo">
          <div className="myTicketCard__eyebrow">
            <CalendarDays size={14} aria-hidden="true" />
            <span>{isUpcoming ? "Live Ticket" : "Past Event"}</span>
          </div>
          <span className="myTicketCard__category">{ticket.organizationName}</span>
          <h3 className="myTicketCard__eventName">{ticket.eventName}</h3>
          <p className="myTicketCard__desc">{ticket.shortDescription}</p>
          <div className="myTicketCard__metaRow">
            <span className="myTicketCard__metaIcon" aria-hidden="true">
              <MapPin size={15} />
            </span>
            <span className="myTicketCard__metaText">{ticket.location}</span>
          </div>
        </div>
      </div>

      <div className="myTicketCard__right">
        <button
          type="button"
          className="myTicketCard__kebab"
          aria-label="More options"
        >
          <MoreHorizontal size={20} aria-hidden="true" />
        </button>

        <div className="myTicketCard__ticketId">
          <span>Ticket ID</span>
          <strong>{ticketCode}</strong>
        </div>

        <div className="myTicketCard__qr" aria-label={`QR preview ${ticketCode}`}>
          <QrCode size={70} aria-hidden="true" />
        </div>

        <div className="myTicketCard__ticketQty">
          <Ticket size={15} aria-hidden="true" />
          <span>
            {ticket.ticketCount} {ticket.ticketCount > 1 ? "Tickets" : "Ticket"}
          </span>
        </div>

        <Link
          to="/app/events"
          className="myTicketCard__primaryBtn"
        >
          {isUpcoming ? "View Ticket" : "View Details"}
        </Link>
      </div>
    </article>
  );
}
