import api from "./api";
import type {
  CreateNotificationPayload,
  NotificationItem,
} from "../types/notification";

export const notificationService = {
  createNotification: async (payload: CreateNotificationPayload) => {
    const res = await api.post("/notifications", payload, {
      skipGlobalToast: true,
    } as any);
    return res.data;
  },
  getNotifications: async () => {
    const res = await api.get("/notifications", { skipGlobalToast: true } as any);
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await api.get("/notifications/unread-count", { skipGlobalToast: true } as any);
    return res.data;
  },
  markAsRead: async (id: string) => {
    const res = await api.patch(`/notifications/${id}/read`, undefined, {
      skipGlobalToast: true,
    } as any);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await api.patch("/notifications/read-all", undefined, {
      skipGlobalToast: true,
    } as any);
    return res.data;
  },
};

export function unwrapNotifications(value: unknown): NotificationItem[] {
  if (Array.isArray(value)) return value as NotificationItem[];

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const keys = ["items", "notifications", "data"];

    for (const key of keys) {
      const nested = payload[key];
      if (Array.isArray(nested)) return nested as NotificationItem[];
      if (nested && typeof nested === "object") {
        const result = unwrapNotifications(nested);
        if (result.length) return result;
      }
    }
  }

  return [];
}

export function unwrapUnreadCount(value: unknown): number {
  if (typeof value === "number") return value;

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const keys = ["count", "unreadCount", "total", "data"];

    for (const key of keys) {
      const nested = payload[key];
      if (typeof nested === "number") return nested;
      if (nested && typeof nested === "object") {
        const result = unwrapUnreadCount(nested);
        if (result) return result;
      }
    }
  }

  return 0;
}
