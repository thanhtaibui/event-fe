import api from "../api";
import type { Query } from "../../types/query"

import type { EventPayload } from "../../types/event/create";

const buildDebugUrl = (path: string, query?: Query) => {
  const searchParams = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `${path}?${queryString}` : path;
};

export const eventService = {
  getEvents: async (query?: Query) => {
    const res = await api.get('events', { params: query });
    return res.data;
  },
  getPublicEvents: async (query?: Query) => {
    console.log("[Public Events] request URL:", buildDebugUrl("/events/public", query));
    const res = await api.get('events/public', {
      params: query,
      skipAuth: true,
    } as any);
    console.log("[Public Events] response data:", res.data);
    return res.data;
  },
  getCategories: async (query?: Query) => {
    const res = await api.get('categories', {
      params: query,
      skipGlobalToast: true,
    } as any);
    return res.data;
  },
  getEventsByOrgSlug: async (slug: string, query?: Query) => {
    const res = await api.get(`/events/org/${slug}`, { params: query });
    return res.data;
  },
  getEventById: async (id: string) => {
    const res = await api.get(`events/${id}`);
    return res.data;
  },
  getTicketTypeById: async (id: string) => {
    const res = await api.get(`events/${id}/ticket-types`);
    return res.data;
  },
  getInviteById: async (id: string) => {
    const res = await api.get(`events/${id}/invites`);
    return res.data;
  },
  createEvent: async (data: EventPayload) => {
    const res = await api.post('events', data);
    return res.data;
  },
  cancelledEvent: async (ids: string[]) => {
    const res = await api.patch('events/cancelled', { ids });
    return res.data;
  },
  publishEvent: async (id: string) => {
    const res = await api.patch(`events/${id}/publish`);
    return res.data;
  },
  updateEvent: async (id: string, payload: EventPayload) => {
    const res = await api.patch(`events/${id}`, payload);
    return res.data;
  }
}
