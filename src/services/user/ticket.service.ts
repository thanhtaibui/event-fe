import api from "../api";

export const getUserTicketsEndpoint = (userId: string) => `/users/${userId}/ticket`;

export type CreateOrderPayload = {
  userId: string;
  items: {
    ticketTypeId: string;
    quantity: number;
  }[];
};

export const userTicketService = {
  getMyTickets: async (userId: string) => {
    const res = await api.get(getUserTicketsEndpoint(userId));
    return res.data;
  },
  createOrder: async (payload: CreateOrderPayload) => {
    const res = await api.post("/order", payload);
    return res.data;
  },
};
