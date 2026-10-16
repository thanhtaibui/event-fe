import api from "./api";

export type OrderItemPayload = {
  ticketTypeId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  userId: string;
  items: OrderItemPayload[];
};

export const createOrder = async (payload: CreateOrderPayload) => {
  console.log("[POST /order] Request payload:", payload);
  try {
    const res = await api.post("/order", payload);
    console.log("[POST /order] Response:", res.data);
    return res.data;
  } catch (error) {
    console.error("[POST /order] Error:", error);
    throw error;
  }
};

export const orderService = {
  createOrder,
};

export default orderService;
