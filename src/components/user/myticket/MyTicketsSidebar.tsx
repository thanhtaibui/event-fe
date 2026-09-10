import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, Headphones, TicketCheck } from "lucide-react";
import type {
  TicketsSidebarSummary,
  UpcomingNextItem,
} from "../../../data/user/myTickets";

type Props = {
  summary: TicketsSidebarSummary;
  upcomingNext: UpcomingNextItem;
};

export default function MyTicketsSidebar({ summary, upcomingNext }: Props) {
  return (
    <aside className="myTicketsSidebar" aria-label="Tickets sidebar">
      <div className="myTicketsSidebar__card">
        <div className="myTicketsSidebar__sectionTitle">
          <TicketCheck size={17} aria-hidden="true" />
          Ticket Summary
        </div>
        <div className="myTicketsSidebar__summaryList">
          <div className="myTicketsSidebar__summaryRow">
            <span>Total</span>
            <span>{summary.total}</span>
          </div>
          <div className="myTicketsSidebar__summaryRow">
            <span>Upcoming</span>
            <span>{summary.upcoming}</span>
          </div>
          <div className="myTicketsSidebar__summaryRow">
            <span>Past</span>
            <span>{summary.past}</span>
          </div>
        </div>
      </div>

      <div className="myTicketsSidebar__card myTicketsSidebar__nextCard">
        <div className="myTicketsSidebar__sectionTitle">
          <CalendarClock size={17} aria-hidden="true" />
          Upcoming Next
        </div>
        <div className="myTicketsSidebar__nextRow">
          <img
            className="myTicketsSidebar__nextImage"
            src={upcomingNext.imageUrl}
            alt={upcomingNext.eventName}
          />
          <div className="myTicketsSidebar__nextText">
            <div className="myTicketsSidebar__nextEvent">
              {upcomingNext.eventName}
            </div>
            <div className="myTicketsSidebar__nextOrg">
              {upcomingNext.organizationName}
            </div>
            <div className="myTicketsSidebar__nextDate">
              {upcomingNext.dateLabel}
            </div>
          </div>
        </div>

        <Link to="/app/events" className="myTicketsSidebar__ctaBtn">
          View Ticket
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="myTicketsSidebar__ctaBox">
        <div className="myTicketsSidebar__ctaTitle">Explore More Events</div>
        <div className="myTicketsSidebar__ctaSub">
          Discover new experiences tailored for you.
        </div>
        <Link
          to="/app/events"
          className="myTicketsSidebar__ctaBtn myTicketsSidebar__ctaBtn--purple"
        >
          Browse Events
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>

      <div className="myTicketsSidebar__help">
        <div className="myTicketsSidebar__sectionTitle">
          <Headphones size={17} aria-hidden="true" />
          Need Help?
        </div>
        <div className="myTicketsSidebar__helpList">
          <Link to="/app" className="myTicketsSidebar__helpLink">
            <span>Support Center</span>
            <span className="myTicketsSidebar__helpArrow" aria-hidden="true">
              {">"}
            </span>
          </Link>
          <Link to="/app" className="myTicketsSidebar__helpLink">
            <span>Contact Us</span>
            <span className="myTicketsSidebar__helpArrow" aria-hidden="true">
              {">"}
            </span>
          </Link>
          <Link to="/app" className="myTicketsSidebar__helpLink">
            <span>How Tickets Work</span>
            <span className="myTicketsSidebar__helpArrow" aria-hidden="true">
              {">"}
            </span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
