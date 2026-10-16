export type TicketStatus = "UPCOMING" | "PAST";

export type MyTicket = {
  id: string;
  orderId?: string;
  order?: {
    id?: string;
    totalPrice?: number;
    [key: string]: unknown;
  };
  status: TicketStatus;
  eventName: string;
  shortDescription: string;
  organizationName: string;
  date: {
    month: string;
    day: string;
    weekday: string;
  };
  location: string;
  ticketCount: number;
  imageUrl: string;
  ticketType?: {
    name?: string;
    price?: number;
    [key: string]: unknown;
  };
  event?: {
    id?: string;
    title?: string;
    bannerUrl?: string | null;
    startDateTime?: string;
    place?: string;
    organization?: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export type TicketsSidebarSummary = {
  total: number;
  upcoming: number;
  past: number;
};

export type UpcomingNextItem = {
  id: string;
  eventName: string;
  organizationName: string;
  dateLabel: string;
  imageUrl: string;
};

export type TicketTypeBreakdown = {
  name: string;
  count: number;
  price?: number;
};

export type GroupedOrder = {
  orderId: string;
  status: TicketStatus;
  eventName: string;
  eventBannerUrl: string | null;
  organizationName: string;
  date: {
    month: string;
    day: string;
    weekday: string;
  };
  location: string;
  totalTickets: number;
  ticketTypeBreakdown: TicketTypeBreakdown[];
  totalPrice?: number;
  tickets: MyTicket[];
  event?: MyTicket["event"];
};

export function groupTicketsByOrder(tickets: MyTicket[]): GroupedOrder[] {
  const groupsMap = new Map<string, MyTicket[]>();

  for (const ticket of tickets) {
    const key = ticket.orderId || ticket.order?.id || `single-${ticket.id}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(ticket);
  }

  const groupedOrders: GroupedOrder[] = [];

  for (const [orderId, orderTickets] of groupsMap.entries()) {
    const firstTicket = orderTickets[0];
    const event = firstTicket.event;

    const status: TicketStatus = orderTickets.some((t) => t.status === "UPCOMING")
      ? "UPCOMING"
      : "PAST";

    const totalTickets = orderTickets.length;

    const typeCountMap = new Map<string, { count: number; price?: number }>();
    let calculatedTotal = 0;
    let hasValidPrice = false;

    for (const t of orderTickets) {
      const typeName = t.ticketType?.name || t.shortDescription || "Standard";
      const price = typeof t.ticketType?.price === "number" ? t.ticketType.price : undefined;

      const existing = typeCountMap.get(typeName);
      if (existing) {
        existing.count += 1;
      } else {
        typeCountMap.set(typeName, { count: 1, price });
      }

      if (price !== undefined && price > 0) {
        calculatedTotal += price;
        hasValidPrice = true;
      }
    }

    const ticketTypeBreakdown: TicketTypeBreakdown[] = Array.from(typeCountMap.entries()).map(
      ([name, info]) => ({
        name,
        count: info.count,
        price: info.price,
      })
    );

    const explicitOrderPrice = firstTicket.order?.totalPrice;
    const finalTotalPrice =
      typeof explicitOrderPrice === "number" && explicitOrderPrice > 0
        ? explicitOrderPrice
        : hasValidPrice
        ? calculatedTotal
        : undefined;

    const bannerUrl =
      event?.bannerUrl !== undefined
        ? event?.bannerUrl
        : firstTicket.imageUrl && firstTicket.imageUrl !== "/default-banner.png"
        ? firstTicket.imageUrl
        : null;

    groupedOrders.push({
      orderId,
      status,
      eventName: event?.title || firstTicket.eventName,
      eventBannerUrl: bannerUrl,
      organizationName: firstTicket.organizationName,
      date: firstTicket.date,
      location: event?.place || firstTicket.location,
      totalTickets,
      ticketTypeBreakdown,
      totalPrice: finalTotalPrice,
      tickets: orderTickets,
      event,
    });
  }

  return groupedOrders;
}

const placeholderImage =
  "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=1200&q=80";

export const myTickets: MyTicket[] = [
  {
    id: "t1",
    status: "UPCOMING",
    eventName: "Neon Night Concert",
    shortDescription: "Live music experience with a futuristic vibe.",
    organizationName: "Eventix Live",
    date: { month: "OCT", day: "12", weekday: "SAT" },
    location: "District 7, Ho Chi Minh City",
    ticketCount: 1,
    imageUrl: placeholderImage,
  },
  {
    id: "t2",
    status: "UPCOMING",
    eventName: "Design & Dev Summit",
    shortDescription: "Workshops, talks, and networking for builders.",
    organizationName: "Studio Collective",
    date: { month: "NOV", day: "03", weekday: "SUN" },
    location: "Vincom Center, Ha Noi",
    ticketCount: 2,
    imageUrl: placeholderImage,
  },
  {
    id: "t3",
    status: "PAST",
    eventName: "Tech Community Meetup",
    shortDescription: "Highlights from the community sessions and Q&A.",
    organizationName: "Local Tech Hub",
    date: { month: "SEP", day: "20", weekday: "FRI" },
    location: "Da Nang Innovation Space",
    ticketCount: 1,
    imageUrl: placeholderImage,
  },
];

export const ticketsSidebarSummary: TicketsSidebarSummary = {
  total: myTickets.length,
  upcoming: myTickets.filter((t) => t.status === "UPCOMING").length,
  past: myTickets.filter((t) => t.status === "PAST").length,
};

export const upcomingNext: UpcomingNextItem = {
  id: myTickets.find((t) => t.status === "UPCOMING")?.id ?? "t1",
  eventName: myTickets.find((t) => t.status === "UPCOMING")?.eventName ?? "Upcoming Event",
  organizationName:
    myTickets.find((t) => t.status === "UPCOMING")?.organizationName ?? "Organization",
  dateLabel: "Next event",
  imageUrl: placeholderImage,
};

