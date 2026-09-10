import { Flame } from "lucide-react";

import type { EventDto } from "../../../types/event/event";

function formatEventDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBA";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

function formatGoing(value: number) {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

function getEventBanner(event: EventDto) {
  return event.eventBanner || "/default-banner.png";
}

type TrendingSidebarProps = {
  events: EventDto[];
};

export default function TrendingSidebar({ events }: TrendingSidebarProps) {
  const trendingEvents = [...events]
    .sort((first, second) => (second.soldTickets || 0) - (first.soldTickets || 0))
    .slice(0, 4);

  return (
    <aside className="event-sidebar" aria-label="Trending events">
      <section className="trending-panel">
        <div className="event-sidebar__heading">
          <Flame size={21} />
          <h2>Trending Now</h2>
        </div>

        <div className="trending-list">
          {trendingEvents.map((item, index) => (
            <article className="trending-item" key={item.id}>
              <span className="trending-item__rank">{index + 1}</span>
              <img src={getEventBanner(item)} alt={item.title} />
              <div>
                <h3>{item.title}</h3>
                <p>
                  {formatEventDate(item.startDateTime)} / {item.place} /{" "}
                  {formatGoing(item.soldTickets || 0)} Going
                </p>
              </div>
            </article>
          ))}
          {trendingEvents.length === 0 && (
            <div className="event-state-card event-state-card--compact">
              No trending events yet.
            </div>
          )}
        </div>
      </section>

    </aside>
  );
}
