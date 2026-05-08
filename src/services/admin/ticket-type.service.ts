import type { TicketType } from "../../types/ticket-type/ticket-type";
import api from "../api";

export const ticketTypeService = {
  createTicketType: async (payload: TicketType) => {
    const res = await api.post("/ticket-types", payload);
    return res.data;
  },
  updateTicketType: async (id: string, payload: TicketType) => {
    const res = await api.patch(`/ticket-types/${id}`, payload);
    return res.data;
  },
  getTicketTypeById: async (id: string) => {
    const res = await api.get(`/ticket-types/${id}`);
    return res.data;
  }
};