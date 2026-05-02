import api from "../api";
import type { Query } from "../../types/query"

export const eventService = {
  getEvents: async (query?: Query) => {
    const res = await api.get('events', { params: query });
    return res.data;
  }
}