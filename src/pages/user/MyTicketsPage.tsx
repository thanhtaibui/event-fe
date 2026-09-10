import { useMemo, useState } from "react";
import { Filter, Search } from "lucide-react";

import MyTicketsHero from "../../components/user/myticket/MyTicketsHero";
import MyTicketCard from "../../components/user/myticket/MyTicketCard";
import MyTicketsSidebar from "../../components/user/myticket/MyTicketsSidebar";
import { useMyTickets } from "../../hooks/user/myticket/useMyTickets";
import type { MyTicket } from "../../data/user/myTickets";

import "../../styles/user/myticket/myTickets.css";

type FilterTab = "UPCOMING" | "PAST";

type SortKey = "featured" | "date";

export default function MyTicketsPage() {
  const [tab, setTab] = useState<FilterTab>("UPCOMING");
  const [sortBy, setSortBy] = useState<SortKey>("featured");
  const [query, setQuery] = useState("");
  const { tickets, summary, upcomingNext, loading, error } = useMyTickets();

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const list = tickets.filter((t) => {
      const matchesTab = t.status === tab;
      if (!normalizedQuery) return matchesTab;

      return (
        matchesTab &&
        [t.eventName, t.organizationName, t.location, t.shortDescription]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      );
    });
    if (sortBy === "date") {
      return [...list].reverse();
    }
    return list;
  }, [query, tab, sortBy, tickets]);

  const renderTickets = (tickets: MyTicket[]) => {
    if (!tickets.length) {
      return <div className="myTicketsEmpty">No tickets found.</div>;
    }

    return (
      <div className="myTicketsList" aria-label="Tickets list">
        {tickets.map((ticket) => (
          <MyTicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    );
  };

  return (
    <div className="myTicketsPage">
      <div className="myTicketsPage__container">
        <MyTicketsHero />

        <section className="myTicketsLayout" aria-label="Tickets layout">
          <div className="myTicketsMain">
            <div className="myTicketsControls" aria-label="Ticket controls">
              <div
                className="myTicketsControls__tabs"
                role="tablist"
                aria-label="Upcoming or Past"
              >
                <button
                  type="button"
                  className={`myTicketsTab ${tab === "UPCOMING" ? "myTicketsTab--active" : ""}`}
                  onClick={() => setTab("UPCOMING")}
                  role="tab"
                  aria-selected={tab === "UPCOMING"}
                >
                  Upcoming
                </button>
                <button
                  type="button"
                  className={`myTicketsTab ${tab === "PAST" ? "myTicketsTab--active" : ""}`}
                  onClick={() => setTab("PAST")}
                  role="tab"
                  aria-selected={tab === "PAST"}
                >
                  Past
                </button>
              </div>

              <div className="myTicketsControls__right">
                <label className="myTicketsSearch" aria-label="Search tickets">
                  <Search size={18} aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search tickets..."
                  />
                </label>
                <div className="myTicketsSort">
                  <label
                    className="myTicketsSort__label"
                    htmlFor="myTicketsSortBy"
                  >
                    Sort by
                  </label>
                  <select
                    id="myTicketsSortBy"
                    className="myTicketsSort__select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                  >
                    <option value="featured">Featured</option>
                    <option value="date">Date</option>
                  </select>
                </div>
                <div className="myTicketsLayoutIcon" aria-hidden="true">
                  <Filter size={17} />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="myTicketsList" aria-label="Loading tickets">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div className="myTicketCard myTicketCard--skeleton" key={index}>
                    <div className="myTicketCard__imageSkeleton" />
                    <div className="myTicketCard__content">
                      <span />
                      <strong />
                      <p />
                    </div>
                    <div className="myTicketCard__qrSkeleton" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {error && (
                  <div className="myTicketsNotice">
                    {error}
                  </div>
                )}
                {renderTickets(filteredTickets)}
              </>
            )}
          </div>

          <MyTicketsSidebar
            summary={summary}
            upcomingNext={upcomingNext}
          />
        </section>
      </div>
    </div>
  );
}
