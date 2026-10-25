import api from "./api";

export type OrderItemPayload = {
  ticketTypeId: string;
  quantity: number;
};

export type CreateOrderPayload = {
  userId: string;
  items: OrderItemPayload[];
};

export type OrderStatus =
  | "PENDING"
  | "PENDING_PAYMENT"
  | "PAID"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "EXPIRED"
  | "UNDERPAID"
  | "OVERPAID";

export type PaymentBankInfo = {
  name: string;
  bin: string;
  accountName: string;
  accountNumber: string;
};

export type VietQrPaymentResponse = {
  paymentId: string;
  orderId: string;
  organizationId: string;
  amount: number;
  currency: string;
  method: string;
  reference: string;
  transferContent: string;
  bank: PaymentBankInfo;
  qrCode: string;
  status: PaymentStatus;
  expiresAt: string;
};

export type PaymentDetailResponse = {
  id: string;
  orderId: string;
  organizationId: string;
  amount: number;
  currency: string;
  method: string;
  reference: string;
  status: PaymentStatus;
  providerTransactionId: string | null;
  createdAt: string;
  verifiedAt: string | null;
  expiresAt: string | null;
};

export type OrderResponse = {
  id?: string;
  orderId?: string;
  status?: OrderStatus | string;
  totalPrice?: number;
  createdAt?: string;
  expiresAt?: string;
  organization?: { id: string; name: string } | null;
  orders?: OrderResponse[];
  tickets?: Array<{
    id: string;
    createdAt?: string;
    status?: string;
    usedAt?: string | null;
    ticketType?: { id?: string; name?: string; price?: number };
    event?: { id?: string; title?: string; startDateTime?: string; endDateTime?: string; place?: string } | null;
  }>;
  items?: Array<{
    ticketTypeId?: string;
    quantity?: number;
    price?: number;
    unitPrice?: number;
    ticketType?: { id?: string; name?: string };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
};

export const extractOrdersFromResponse = (response: any): OrderResponse[] => {
  const data = response?.data || response;
  if (!data) return [];
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data)) return data;
  if (data.id || data.orderId) return [data];
  return [];
};

export const createOrder = async (payload: CreateOrderPayload): Promise<OrderResponse> => {
  console.log("[POST /order] Request payload:", payload);
  try {
    const res = await api.post("/order", payload);
    console.log("[POST /order] Response:", res.data);
    return res.data?.data || res.data;
  } catch (error) {
    console.error("[POST /order] Error:", error);
    throw error;
  }
};

export const createVietQrPayment = async (
  orderId: string,
): Promise<VietQrPaymentResponse> => {
  console.log(`[POST /payments/orders/${orderId}] Initializing VietQR payment`);
  try {
    const res = await api.post(`/payments/orders/${orderId}`);
    console.log(`[POST /payments/orders/${orderId}] Response:`, res.data);
    return res.data?.data || res.data;
  } catch (error) {
    console.error(`[POST /payments/orders/${orderId}] Error:`, error);
    throw error;
  }
};

export const getPaymentById = async (
  paymentId: string,
): Promise<PaymentDetailResponse> => {
  try {
    const res = await api.get(`/payments/${paymentId}`);
    return res.data?.data || res.data;
  } catch (error) {
    console.error(`[GET /payments/${paymentId}] Error:`, error);
    throw error;
  }
};

export const getOrderById = async (orderId: string): Promise<OrderResponse> => {
  try {
    const res = await api.get(`/order/${orderId}`);
    return res.data?.data || res.data;
  } catch (error) {
    console.error(`[GET /order/${orderId}] Error:`, error);
    throw error;
  }
};

export const orderService = {
  createOrder,
  extractOrdersFromResponse,
  createVietQrPayment,
  getPaymentById,
  getOrderById,
};

export default orderService;
