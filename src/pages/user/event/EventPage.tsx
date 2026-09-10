import { useEffect, useMemo, useState } from "react";

import CategoryTabs from "../../../components/user/event/CategoryTabs";
import EventFooterStats from "../../../components/user/event/EventFooterStats";
import EventHero from "../../../components/user/event/EventHero";
import FeaturedEvents from "../../../components/user/event/FeaturedEvents";
import TrendingSidebar from "../../../components/user/event/TrendingSidebar";
import { useEvents } from "../../../hooks/user/event/useEvents";
import { eventService } from "../../../services/admin/event.service";
import type { CategoryDto, EventDto } from "../../../types/event/event";
import "../../../styles/user/event/event.css";

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
      data?: CategoryDto[] | { items?: CategoryDto[] };
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

function extractCategories(response: CategoryResponse) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.items)) return response.items;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && "items" in response.data && Array.isArray(response.data.items)) {
    return response.data.items;
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
      "filter.categories.id":
        activeCategory === "all" ? undefined : `$eq:${activeCategory}`,
    }),
    [activeCategory, page, searchQuery],
  );
  const { data, events, loading, error } = useEvents(eventQuery);

  useEffect(() => {
    let ignore = false;

    const fetchCategories = async () => {
      try {
        const response = await eventService.getCategories({ limit: 100 });
        if (!ignore) setCategories(extractCategories(response));
      } catch {
        if (!ignore) setCategories([]);
      }
    };

    fetchCategories();

    return () => {
      ignore = true;
    };
  }, []);

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

  const handleCategoryChange = (nextCategory: string) => {
    setPage(1);
    setLoadedEvents([]);
    setActiveCategory(nextCategory);
  };

  return (
    <div className="event-page">
      <EventHero
        dateFilter={dateFilter}
        locationFilter={locationFilter}
        locationOptions={VIETNAM_PROVINCES}
        searchQuery={searchQuery}
        onDateFilterChange={setDateFilter}
        onLocationFilterChange={setLocationFilter}
        onSearch={(nextSearchQuery) => {
          setPage(1);
          setLoadedEvents([]);
          setSearchQuery(nextSearchQuery);
        }}
      />

      <main className="event-page__main">
        <CategoryTabs
          activeCategory={activeCategory}
          categories={categories}
          onCategoryChange={handleCategoryChange}
        />
        <div className="event-page__feature-layout">
          <div className="event-page__content">
          <FeaturedEvents
            events={visibleEvents}
            loading={loading && page === 1}
            error={error}
          />
          {!error && hasMoreEvents && (
            <button
              className="event-page__load-more"
              type="button"
              disabled={loading}
              data-loading={loading ? "true" : "false"}
              onClick={() => setPage((currentPage) => currentPage + 1)}
            >
              <span>Load More Events</span>
            </button>
          )}
          </div>
          <TrendingSidebar events={publishedEvents} />
        </div>
      </main>

      <EventFooterStats />
    </div>
  );
}
