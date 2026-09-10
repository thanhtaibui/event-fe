import {
  CalendarDays,
  Compass,
  MapPin,
  Search,
} from "lucide-react";
import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

const heroEvent = "/bg-event.png";

function normalizeOption(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim()
    .toLowerCase();
}

type DateFilter = "all" | "today" | "week" | "month" | "upcoming";

type EventHeroProps = {
  searchQuery?: string;
  locationFilter?: string;
  dateFilter?: DateFilter;
  locationOptions?: string[];
  onSearch?: (query: string) => void;
  onLocationFilterChange?: (location: string) => void;
  onDateFilterChange?: (dateFilter: DateFilter) => void;
};

export default function EventHero({
  searchQuery = "",
  locationFilter = "",
  dateFilter = "all",
  locationOptions = [],
  onSearch = () => undefined,
  onLocationFilterChange = () => undefined,
  onDateFilterChange = () => undefined,
}: EventHeroProps) {
  const [draftSearch, setDraftSearch] = useState(searchQuery);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);

  const visibleLocationOptions = useMemo(() => {
    const query = normalizeOption(locationFilter);
    if (!query) return locationOptions;
    return locationOptions.filter((location) =>
      normalizeOption(location).includes(query),
    );
  }, [locationFilter, locationOptions]);

  useEffect(() => {
    setDraftSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(draftSearch.trim());
  };

  return (
    <section className="event-hero">
      <div className="event-hero__content">
        <p className="event-hero__eyebrow">
          <Compass size={15} aria-hidden="true" />
          Transforming live experiences
        </p>
        <h1>
          Discover
          <span>Events</span>
        </h1>
        <p className="event-hero__copy">
          Find experiences, communities and events that match your interests.
        </p>

        <form
          className="event-filter"
          aria-label="Search events"
          onSubmit={handleSearchSubmit}
        >
          <label className="event-filter__field event-filter__field--wide">
            <Search size={20} />
            <input
              type="search"
              value={draftSearch}
              placeholder="Search events..."
              onChange={(event) => setDraftSearch(event.target.value)}
            />
          </label>
          <label className="event-filter__select event-filter__location">
            <MapPin size={19} />
            <input
              type="search"
              value={locationFilter}
              aria-label="Filter by location"
              placeholder="Province / city"
              autoComplete="off"
              onChange={(event) => onLocationFilterChange(event.target.value)}
              onFocus={() => setLocationMenuOpen(true)}
              onBlur={() => {
                window.setTimeout(() => setLocationMenuOpen(false), 120);
              }}
            />
            {locationMenuOpen && visibleLocationOptions.length > 0 && (
              <div className="event-filter__locationMenu">
                <button
                  type="button"
                  className="event-filter__locationOption"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onLocationFilterChange("");
                    setLocationMenuOpen(false);
                  }}
                >
                  All provinces
                </button>
                {visibleLocationOptions.slice(0, 10).map((location) => (
                  <button
                    type="button"
                    className="event-filter__locationOption"
                    key={location}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onLocationFilterChange(location);
                      setLocationMenuOpen(false);
                    }}
                  >
                    {location}
                  </button>
                ))}
              </div>
            )}
          </label>
          <label className="event-filter__select">
            <CalendarDays size={19} />
            <select
              value={dateFilter}
              aria-label="Filter by date"
              onChange={(event) =>
                onDateFilterChange(event.target.value as DateFilter)
              }
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">Next 7 Days</option>
              <option value="month">This Month</option>
              <option value="upcoming">Upcoming</option>
            </select>
          </label>
          <button className="event-filter__submit" type="submit">
            <Search size={18} />
            <span>Search</span>
          </button>
        </form>
      </div>

      <div className="event-hero__visual" aria-hidden="true">
        <img
          src={heroEvent}
          alt=""
          className="event-hero__image"
        />
        <div className="event-hero__visualCard event-hero__visualCard--top">
          <strong>Today</strong>
          <span>Curated picks</span>
        </div>
        <div className="event-hero__visualCard event-hero__visualCard--bottom">
          <strong>Live</strong>
          <span>Fresh listings</span>
        </div>
      </div>
    </section>
  );
}
