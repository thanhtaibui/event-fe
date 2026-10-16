import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  MapPin,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
  Tag,
} from "lucide-react";
import { Link } from "react-router-dom";

import EventFilterDropdown, {
  type EventFilterDropdownOption,
} from "../../../components/user/event/EventFilterDropdown";
import { useEvents } from "../../../hooks/user/event/useEvents";
import { eventService } from "../../../services/admin/event.service";
import type { CategoryDto, EventDto } from "../../../types/event/event";
import { encodeId } from "../../../utils/hash";
import "../../../styles/user/event/event-premium.css";

type DateFilter = "all" | "today" | "week" | "month" | "upcoming";

const VIETNAM_PROVINCES = [
  "An Giang",
  "Bắc Ninh",
  "Cà Mau",
  "Cao Bằng",
  "Cần Thơ",
  "Đà Nẵng",
  "Đắk Lắk",
  "Điện Biên",
  "Đồng Nai",
  "Đồng Tháp",
  "Gia Lai",
  "Hà Nội",
  "Hà Tĩnh",
  "Hải Phòng",
  "Hồ Chí Minh",
  "Huế",
  "Hưng Yên",
  "Khánh Hòa",
  "Lai Châu",
  "Lâm Đồng",
  "Lạng Sơn",
  "Lào Cai",
  "Nghệ An",
  "Ninh Bình",
  "Phú Thọ",
  "Quảng Ngãi",
  "Quảng Ninh",
  "Quảng Trị",
  "Sơn La",
  "Tây Ninh",
  "Thái Nguyên",
  "Thanh Hóa",
  "Tuyên Quang",
  "Vĩnh Long",
];

const EVENT_PAGE_SIZE = 12;

type CategoryResponse =
  | CategoryDto[]
  | {
      data?: CategoryDto[] | { items?: CategoryDto[]; data?: CategoryDto[] };
      items?: CategoryDto[];
    };

function normalizeText(value?: string | number | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .trim()
    .toLowerCase();
}

function isCancelled(event: EventDto) {
  return normalizeText(event.status) === "cancelled";
}

function getEventSearchText(event: EventDto) {
  return [
    event.title,
    event.place,
    event.organization?.name,
    event.description,
    event.status,
  ]
    .map(normalizeText)
    .join(" ");
}

function extractCategories(response: CategoryResponse): CategoryDto[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && "items" in response.data && Array.isArray(response.data.items)) {
    return response.data.items;
  }
  if (response.data && "data" in response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }

  return [];
}

function matchesDate(event: EventDto, filter: DateFilter) {
  if (filter === "all") return true;

  const eventDate = new Date(event.startDateTime);
  if (Number.isNaN(eventDate.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);

  if (filter === "today") {
    return eventDay.getTime() === today.getTime();
  }

  if (filter === "week") {
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    return eventDay >= today && eventDay <= nextWeek;
  }

  if (filter === "month") {
    return (
      eventDay.getFullYear() === today.getFullYear() &&
      eventDay.getMonth() === today.getMonth()
    );
  }

  return eventDay >= today;
}

function getEventImage(event: EventDto) {
  return event.eventBanner || event.eventPoster || "/default-banner.png";
}

function getDateParts(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: "--", month: "TBA" };
  }

  return {
    day: date.getDate().toString().padStart(2, "0"),
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
  };
}

function formatDate(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function formatTimeRange(start: string | Date, end: string | Date) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime())) return "Time to be announced";

  const startTime = startDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (Number.isNaN(endDate.getTime())) return startTime;

  const endTime = endDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${startTime} - ${endTime}`;
}

function getStatusClass(status: string) {
  return normalizeText(status).replace(/[^a-z0-9]+/g, "-") || "default";
}

function getCapacityLabel(event: EventDto) {
  const capacity = Number(event.capacity || 0);
  const soldTickets = Number(event.soldTickets || 0);

  if (!capacity) return "Open capacity";

  const remaining = Math.max(capacity - soldTickets, 0);
  return `${remaining} seats left`;
}

function getPrimaryCategory(event: EventDto) {
  return event.categories?.[0]?.name || "Event";
}

function getEventLoadErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const status = (error as { response?: { status?: number } }).response?.status;

    if (status === 401) {
      return "Please sign in to view events.";
    }

    if (status === 403) {
      return "Your account does not have access to this event feed.";
    }
  }

  return "Please refresh or try again in a moment.";
}

export default function EventPage() {
  const [page, setPage] = useState(1);
  const [loadedEvents, setLoadedEvents] = useState<EventDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");

  const eventQuery = useMemo(
    () => ({
      page,
      limit: EVENT_PAGE_SIZE,
      search: searchQuery || undefined,
      searchBy: searchQuery ? "title,place" : undefined,
      "filter.place": locationFilter ? `$ilike:${locationFilter}` : undefined,
      "filter.categories.id":
        activeCategory === "all" ? undefined : `$eq:${activeCategory}`,
    }),
    [activeCategory, locationFilter, page, searchQuery],
  );
  const { data, events, loading, error } = useEvents(eventQuery);

  useEffect(() => {
    let ignore = false;

    const fetchCategories = async () => {
      try {
        const response = await eventService.getCategories();
        const extracted = extractCategories(response);
        if (!ignore && extracted.length > 0) {
          setCategories(extracted);
        }
      } catch {
        // Fallback to events categories if auth/network prevents direct category list
      }
    };

    fetchCategories();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!events || events.length === 0) return;
    setCategories((prevCategories) => {
      const categoryMap = new Map<string, CategoryDto>();
      prevCategories.forEach((cat) => {
        if (cat.id) categoryMap.set(cat.id, cat);
      });
      events.forEach((event) => {
        event.categories?.forEach((cat) => {
          if (cat.id && !categoryMap.has(cat.id)) {
            categoryMap.set(cat.id, cat);
          }
        });
      });
      return Array.from(categoryMap.values());
    });
  }, [events]);

  useEffect(() => {
    if (!data) return;
    setLoadedEvents((currentEvents) => {
      const nextEvents = page === 1 ? [] : [...currentEvents];
      const seenIds = new Set(nextEvents.map((event) => event.id));

      events.forEach((event) => {
        if (!seenIds.has(event.id)) {
          seenIds.add(event.id);
          nextEvents.push(event);
        }
      });

      return nextEvents;
    });
  }, [data, events, page]);

  const publishedEvents = useMemo(
    () => loadedEvents.filter((event) => !isCancelled(event)),
    [loadedEvents],
  );

  const visibleEvents = useMemo(() => {
    const query = normalizeText(searchQuery);
    const locationQuery = normalizeText(locationFilter);

    return publishedEvents.filter((event) => {
      const matchesSearch =
        !query || getEventSearchText(event).includes(query);
      const matchesLocation = !locationQuery
        || normalizeText(event.place).includes(locationQuery);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesDate(event, dateFilter)
      );
    });
  }, [dateFilter, locationFilter, publishedEvents, searchQuery]);

  const hasMoreEvents = Boolean(
    data && data.page < data.totalPages,
  );

  const selectedCategoryName =
    activeCategory === "all"
      ? "All categories"
      : categories.find((category) => category.id === activeCategory)?.name || "Selected category";

  const locationOptions = useMemo<EventFilterDropdownOption[]>(
    () => [
      { value: "", label: "All locations" },
      ...VIETNAM_PROVINCES.map((province) => ({
        value: province,
        label: province,
      })),
    ],
    [],
  );

  const dateOptions = useMemo<EventFilterDropdownOption[]>(
    () => [
      { value: "all", label: "Any date" },
      { value: "today", label: "Today" },
      { value: "week", label: "This week" },
      { value: "month", label: "This month" },
      { value: "upcoming", label: "Upcoming" },
    ],
    [],
  );

  const categoryOptions = useMemo<EventFilterDropdownOption[]>(
    () => [
      { value: "all", label: "All categories" },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  );

  const handleCategoryChange = (nextCategory: string) => {
    setPage(1);
    setLoadedEvents([]);
    setActiveCategory(nextCategory);
  };

  const handleSearchChange = (nextSearchQuery: string) => {
    setPage(1);
    setLoadedEvents([]);
    setSearchQuery(nextSearchQuery);
  };

  const handleLocationChange = (nextLocation: string) => {
    setPage(1);
    setLoadedEvents([]);
    setLocationFilter(nextLocation);
  };

  const handleResetFilters = () => {
    setPage(1);
    setLoadedEvents([]);
    setSearchQuery("");
    setActiveCategory("all");
    setLocationFilter("");
    setDateFilter("all");
  };

  const renderEventCard = (event: EventDto) => {
    const dateParts = getDateParts(event.startDateTime);
    const statusClass = getStatusClass(String(event.status));

    return (
      <article className="event-discovery-card" key={event.id}>
        <Link
          className="event-discovery-card__media"
          to={`/app/events/${encodeId(event.id)}`}
          aria-label={`View details for ${event.title}`}
        >
          <img src={getEventImage(event)} alt={event.title} loading="lazy" />
          <span className="event-discovery-card__date" aria-label={formatDate(event.startDateTime)}>
            <strong>{dateParts.day}</strong>
            <span>{dateParts.month}</span>
          </span>
          <span className={`event-discovery-card__status event-discovery-card__status--${statusClass}`}>
            {event.status}
          </span>
        </Link>

        <div className="event-discovery-card__body">
          <div className="event-discovery-card__topline">
            <span>{getPrimaryCategory(event)}</span>
            <small>{getCapacityLabel(event)}</small>
          </div>

          <h3>
            <Link to={`/app/events/${encodeId(event.id)}`}>{event.title}</Link>
          </h3>

          <div className="event-discovery-card__info">
            <p>
              <CalendarDays size={14} aria-hidden="true" />
              <span>{formatDate(event.startDateTime)}</span>
            </p>
            <p>
              <Clock3 size={14} aria-hidden="true" />
              <span>{formatTimeRange(event.startDateTime, event.endDateTime)}</span>
            </p>
            <p>
              <MapPin size={14} aria-hidden="true" />
              <span>{event.place || "Location to be announced"}</span>
            </p>
          </div>

          <div className="event-discovery-card__footer">
            <div className="event-discovery-card__organizer">
              <span className="event-discovery-card__orgIcon" aria-hidden="true">
                <Building2 size={14} />
              </span>
              <span>{event.organization?.name || "Eventix Partner"}</span>
            </div>
            <Link className="event-discovery-card__cta" to={`/app/events/${encodeId(event.id)}`}>
              Details
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="event-discovery event-page--premium">
      <section className="event-discovery__hero" aria-labelledby="event-discovery-title">
        <div className="event-discovery__heroCopy">
          <h1 id="event-discovery-title">
            Discover events worth showing up for.
          </h1>
          <p>
            Find curated community events, workshops and experiences with clear
            dates, places and organizers before you book.
          </p>

          <form
            className="event-discovery__search"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="event-discovery__searchField">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">Search events</span>
              <input
                type="search"
                value={searchQuery}
                placeholder="Search by event, organizer or place"
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </label>
            <button className="event-discovery__primaryAction" type="submit">
              Search
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </form>
        </div>
      </section>

      <main className="event-discovery__main">
        <section className="event-discovery__toolbar" aria-label="Event filters">
          <div className="event-discovery__filterBar">
            <span className="event-discovery__filterTitle">
              <SlidersHorizontal size={15} aria-hidden="true" />
              Refine
            </span>
            <EventFilterDropdown
              Icon={MapPin}
              label="Location"
              options={locationOptions}
              value={locationFilter}
              onChange={handleLocationChange}
            />

            <EventFilterDropdown
              Icon={CalendarDays}
              label="Date"
              options={dateOptions}
              value={dateFilter}
              onChange={(nextDate) => setDateFilter(nextDate as DateFilter)}
            />

            <EventFilterDropdown
              Icon={Tag}
              label="Category"
              options={categoryOptions}
              value={activeCategory}
              onChange={handleCategoryChange}
            />

            <button
              className="event-discovery__resetButton"
              type="button"
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} aria-hidden="true" />
              Reset
            </button>
          </div>
        </section>

        <section className="event-discovery__results" aria-live="polite">
          <div className="event-discovery__sectionHead">
            <div>
              <span>{selectedCategoryName}</span>
              <h2>Available experiences</h2>
            </div>
            <p>
              Showing {visibleEvents.length} event{visibleEvents.length === 1 ? "" : "s"}
            </p>
          </div>

          {loading && page === 1 && (
            <div className="event-discovery__grid" aria-label="Loading events">
              {Array.from({ length: 6 }, (_, index) => (
                <div className="event-discovery-skeleton" key={index}>
                  <span />
                  <strong />
                  <small />
                  <em />
                </div>
              ))}
            </div>
          )}

          {!loading && Boolean(error) && (
            <div className="event-discovery-state event-discovery-state--error">
              <SearchX size={30} aria-hidden="true" />
              <h3>Could not load events</h3>
              <p>{getEventLoadErrorMessage(error)}</p>
            </div>
          )}

          {!loading && !error && visibleEvents.length === 0 && (
            <div className="event-discovery-state">
              <SearchX size={34} aria-hidden="true" />
              <h3>No events match these filters</h3>
              <p>Try a broader search, another category or a different location.</p>
              <button type="button" onClick={handleResetFilters}>
                Reset filters
              </button>
            </div>
          )}

          {!error && visibleEvents.length > 0 && (
            <div className="event-discovery__grid">
              {visibleEvents.map((event) => renderEventCard(event))}
            </div>
          )}

          {!error && hasMoreEvents && (
            <button
              className="event-discovery__loadMore"
              type="button"
              disabled={loading}
              data-loading={loading ? "true" : "false"}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              <span>{loading ? "Loading..." : "Load more events"}</span>
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
