export type TicketStatus = "UPCOMING" | "PAST";

export type MyTicket = {
  id: string;
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

