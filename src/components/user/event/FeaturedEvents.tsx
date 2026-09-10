import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Heart,
  MapPin,
  SearchX,
  Users,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

import useDragScroll from "../../../hooks/table/useDragScroll";
import type { EventDto } from "../../../types/event/event";
import { encodeId } from "../../../utils/hash";

function getTagClass(tag: string) {
  return `event-card__tag event-card__tag--${tag.toLowerCase()}`;
}

function getEventDateParts(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { month: "TBA", day: "--" };
  }

  return {
    month: date.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: date.getDate().toString().padStart(2, "0"),
  };
}

function getEventDateTime(value: string | Date) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function getEventTags(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "upcoming") return ["New"];
  if (normalized === "ongoing") return ["Trending"];
  if (normalized === "cancelled") return ["Cancelled"];
  if (normalized === "ended") return ["Ended"];
  return [status];
}

function formatGoing(event: EventDto) {
  const soldTickets = event.soldTickets || 0;
  if (soldTickets >= 1000) {
    return `${(soldTickets / 1000).toFixed(1)}K Going`;
  }
  return `${soldTickets} Going`;
}

function getEventBanner(event: EventDto) {
  return event.eventBanner || "/default-banner.png";
}

type FeaturedEventsProps = {
  events: EventDto[];
  loading: boolean;
  error: unknown;
};

export default function FeaturedEvents({
  events,
  loading,
  error,
}: FeaturedEventsProps) {
  const carouselRef = useRef<HTMLDivElement | null>(null);
  useDragScroll(carouselRef);
  const featuredEvents = events.slice(0, 6);
  const allEvents = events;

  const scrollFeaturedEvents = (direction: "previous" | "next") => {
    const carousel = carouselRef.current;
    if (!carousel) return;

    carousel.scrollBy({
      left: direction === "next" ? carousel.clientWidth * 0.82 : -carousel.clientWidth * 0.82,
      behavior: "smooth",
    });
  };

  const renderEventCard = (event: EventDto, isSpotlight = false) => (
    <article
      className={`event-card${isSpotlight ? " event-card--spotlight" : ""}`}
      key={event.id}
    >
      <div className="event-card__media">
        <img src={getEventBanner(event)} alt={event.title} />
        <div className="event-card__tags">
          {getEventTags(event.status).map((tag) => (
            <span className={getTagClass(tag)} key={tag}>
              {tag}
            </span>
          ))}
        </div>
        <button
          className="event-card__favorite"
          type="button"
          aria-label={`Save ${event.title}`}
        >
          <Heart size={18} />
        </button>
        <time
          className="event-card__date"
          dateTime={getEventDateTime(event.startDateTime)}
        >
          <span>{getEventDateParts(event.startDateTime).month}</span>
          <strong>{getEventDateParts(event.startDateTime).day}</strong>
        </time>
      </div>

      <div className="event-card__body">
        <div className="event-card__organizer">
          <span>{event.organization?.name || "Eventix Partner"}</span>
          <small>{event.status}</small>
        </div>
        <h3>{event.title}</h3>

        <div className="event-card__details">
          <p className="event-card__location">
            <MapPin size={16} />
            <span>{event.place}</span>
          </p>
          <p className="event-card__location">
            <CalendarDays size={16} />
            <span>
              {new Date(event.startDateTime).toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              })}
            </span>
          </p>
        </div>

        <div className="event-card__meta">
          <div className="event-card__avatars" aria-hidden="true">
            {[12, 32, 47].map((avatar) => (
              <img
                src={`https://i.pravatar.cc/96?img=${avatar}`}
                alt=""
                key={avatar}
              />
            ))}
          </div>
          <span>
            <Users size={15} aria-hidden="true" />
            {formatGoing(event)}
          </span>
        </div>

        <Link
          className="event-card__detailLink"
          to={`/app/events/${encodeId(event.id)}`}
        >
          {isSpotlight ? "Register now" : "View details"}
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );

  return (
    <section className="featured-events">
      <div className="event-section-heading">
        <div>
          <span className="event-section-heading__eyebrow">Curated marketplace</span>
          <h2>Featured Events</h2>
        </div>
        <Link to="/app/events" aria-label="View all featured events">
          <span>View All Events</span>
          <ArrowRight size={17} />
        </Link>
      </div>

      {loading && (
        <div className="featured-events__skeletonGrid" aria-label="Loading events">
          {[1, 2, 3, 4].map((item) => (
            <div className="event-card-skeleton" key={item}>
              <span />
              <strong />
              <small />
            </div>
          ))}
        </div>
      )}

      {!loading && Boolean(error) && (
        <div className="event-state-card event-state-card--error">
          Could not load events. Please try again.
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="event-empty-state">
          <div className="event-empty-state__icon">
            <SearchX size={34} aria-hidden="true" />
          </div>
          <h3>No events found</h3>
          <p>
            Try changing your search, location, date or category filters to
            discover more experiences.
          </p>
          <Link to="/app/events">Reset discovery</Link>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <>
          <div className="featured-events__carouselShell">
            <button
              className="featured-events__nav featured-events__nav--previous"
              type="button"
              aria-label="Previous featured events"
              onClick={() => scrollFeaturedEvents("previous")}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <div
              className="featured-events__carousel"
              aria-label="Featured event carousel"
              ref={carouselRef}
            >
              {featuredEvents.map((event, index) => renderEventCard(event, index === 0))}
            </div>
            <button
              className="featured-events__nav featured-events__nav--next"
              type="button"
              aria-label="Next featured events"
              onClick={() => scrollFeaturedEvents("next")}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="event-section-heading event-section-heading--all">
            <div>
              <span className="event-section-heading__eyebrow">All events</span>
              <h2>Explore every experience</h2>
            </div>
          </div>

          <div className="featured-events__grid">
            {allEvents.map((event) => renderEventCard(event))}
          </div>
        </>
      )}
    </section>
  );
}
