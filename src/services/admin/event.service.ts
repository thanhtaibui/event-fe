import api from "../api";
import type { Query } from "../../types/query"

import type { EventPayload } from "../../types/event/create";

export const eventService = {
  getEvents: async (query?: Query) => {
    const res = await api.get('events', { params: query });
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
  createEvent: async (data: EventPayload) => {
    const res = await api.post('events', data);
    return res.data;
  },
  cancelledEvent: async (ids: string[]) => {
    const res = await api.patch('events/cancelled', { ids });
    return res.data;
  },
  updateEvent: async (id: string, payload: EventPayload) => {
    const res = await api.patch(`events/${id}`, payload);
    return res.data;
  }
}
