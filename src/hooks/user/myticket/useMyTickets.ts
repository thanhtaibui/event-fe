import { useCallback, useEffect, useMemo, useState } from "react";
import { jwtDecode } from "jwt-decode";

import { getAccessToken } from "../../../constants/authStorage";
import { userTicketService } from "../../../services/user/ticket.service";
import type { JwtPayloadCustom } from "../../../types/JwtPayloadCustom";
import {
  type MyTicket,
  type TicketsSidebarSummary,
  type UpcomingNextItem,
} from "../../../data/user/myTickets";

function unwrapItems(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const keys = ["items", "tickets", "registrations", "data"];

    for (const key of keys) {
      const nested = payload[key];
      if (Array.isArray(nested)) return nested;
      if (nested && typeof nested === "object") {
        const result = unwrapItems(nested);
        if (result.length) return result;
      }
    }
  }

  return [];
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function pickNumber(...values: unknown[]) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function getDateParts(value: unknown) {
  const date = value ? new Date(String(value)) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;

  return {
    month: safeDate.toLocaleString("en", { month: "short" }).toUpperCase(),
    day: safeDate.toLocaleString("en", { day: "2-digit" }),
    weekday: safeDate.toLocaleString("en", { weekday: "short" }).toUpperCase(),
  };
}

function getTicketStatus(item: Record<string, unknown>, event: Record<string, unknown>): MyTicket["status"] {
  const rawStatus = pickString(item.status, event.status).toUpperCase();
  if (["PAST", "USED", "ENDED", "CHECKED_IN"].includes(rawStatus)) return "PAST";

  const endDate = pickString(event.endDateTime, item.endDateTime);
  if (endDate && new Date(endDate).getTime() < Date.now()) return "PAST";

  return "UPCOMING";
}

function normalizeTicket(item: unknown, index: number): MyTicket {
  const record = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
  const event = (record.event && typeof record.event === "object" ? record.event : record) as Record<string, unknown>;
  const organization =
    event.organization && typeof event.organization === "object"
      ? (event.organization as Record<string, unknown>)
      : {};
  const ticketType =
    record.ticketType && typeof record.ticketType === "object"
      ? (record.ticketType as Record<string, unknown>)
      : {};

  const id = pickString(record.id, record.ticketId, event.id) || `ticket-${index}`;
  const startDate = pickString(event.startDateTime, record.startDateTime, record.createdAt);
  const ticketTypeName = pickString(ticketType.name, record.ticketTypeName, record.type);
  const eventName = pickString(event.title, record.eventName, record.title) || "Untitled event";
  const organizationName =
    pickString(organization.name, record.organizationName, record.orgName) || "Eventix";

  return {
    id,
    status: getTicketStatus(record, event),
    eventName,
    shortDescription:
      pickString(ticketTypeName, event.description, record.description) || "Live Ticket",
    organizationName,
    date: getDateParts(startDate),
    location: pickString(event.place, record.location, record.place) || "Online",
    ticketCount: Math.max(1, pickNumber(record.quantity, record.ticketCount, record.count, 1)),
    imageUrl:
      pickString(event.eventBanner, event.eventPoster, record.imageUrl, record.banner) ||
      "/default-banner.png",
  };
}

function buildSummary(tickets: MyTicket[]): TicketsSidebarSummary {
  return {
    total: tickets.length,
    upcoming: tickets.filter((ticket) => ticket.status === "UPCOMING").length,
    past: tickets.filter((ticket) => ticket.status === "PAST").length,
  };
}

function buildUpcomingNext(tickets: MyTicket[]): UpcomingNextItem {
  const ticket = tickets.find((item) => item.status === "UPCOMING") || tickets[0];

  return {
    id: ticket?.id || "empty",
    eventName: ticket?.eventName || "No upcoming ticket",
    organizationName: ticket?.organizationName || "Eventix",
    dateLabel: ticket ? `${ticket.date.month} ${ticket.date.day}` : "Explore events",
    imageUrl: ticket?.imageUrl || "/default-banner.png",
  };
}

export function useMyTickets() {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return "";

    try {
      return jwtDecode<JwtPayloadCustom>(token).sub || "";
    } catch {
      return "";
    }
  }, []);

  const fetchTickets = useCallback(async () => {
    if (!currentUserId) {
      setTickets([]);
      setLoading(false);
      setError("Please login to view tickets.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await userTicketService.getMyTickets(currentUserId);
      const items = unwrapItems(response?.data ?? response);
      setTickets(items.map(normalizeTicket));
    } catch (err: any) {
      setError(err?.response?.data?.message || "Could not load tickets.");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const summary = useMemo(() => buildSummary(tickets), [tickets]);
  const upcomingNext = useMemo(() => buildUpcomingNext(tickets), [tickets]);

  return {
    tickets,
    summary,
    upcomingNext,
    loading,
    error,
    refetch: fetchTickets,
  };
}
