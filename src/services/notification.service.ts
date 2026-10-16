import api from "./api";
import { jwtDecode } from "jwt-decode";
import { getAccessToken } from "../constants/authStorage";
import type {
  CreateNotificationPayload,
  NotificationItem,
} from "../types/notification";

export const NOTIFICATIONS_CHANGED_EVENT = "eventix:notifications-changed";

function notifyNotificationsChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

function normalizeNotification(item: NotificationItem): NotificationItem {
  const raw = item as NotificationItem & {
    _id?: string;
    notificationId?: string;
    readAt?: string | null;
  };

  return {
    ...item,
    id: item.id || raw._id || raw.notificationId || "",
    isRead: item.isRead ?? item.read ?? Boolean(raw.readAt),
    read: item.read ?? item.isRead ?? Boolean(raw.readAt),
  };
}

function getCurrentUserId() {
  const token = getAccessToken();
  if (!token) return "";

  try {
    const decoded = jwtDecode<{ sub?: string; id?: string; userId?: string }>(token);
    return decoded.sub || decoded.id || decoded.userId || "";
  } catch {
    return "";
  }
}

function shouldRetryCreateNotification(error: any) {
  const status = error?.response?.status;
  return status === 400 || status === 422;
}

function buildCreatePayloadAttempts(payload: CreateNotificationPayload) {
  const receiverId = payload.userId || payload.recipientId || getCurrentUserId();
  const content = payload.content || payload.message;
  const base = {
    type: payload.type,
    title: payload.title,
  };

  const attempts = [
    { ...base, message: payload.message },
    { ...base, content },
    receiverId ? { ...base, message: payload.message, userId: receiverId } : null,
    receiverId ? { ...base, message: payload.message, recipientId: receiverId } : null,
    receiverId ? { ...base, content, userId: receiverId } : null,
    receiverId ? { ...base, content, recipientId: receiverId } : null,
  ].filter(Boolean) as Array<Record<string, unknown>>;

  const seen = new Set<string>();
  return attempts.filter((attempt) => {
    const key = JSON.stringify(attempt);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const notificationService = {
  createNotification: async (payload: CreateNotificationPayload) => {
    const attempts = buildCreatePayloadAttempts(payload);
    let lastError: unknown = null;

    for (const attempt of attempts) {
      try {
        const res = await api.post("/notifications", attempt, {
          skipGlobalToast: true,
        } as any);
        notifyNotificationsChanged();
        return res.data;
      } catch (error) {
        lastError = error;
        if (!shouldRetryCreateNotification(error)) break;
      }
    }

    throw lastError;
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
  if (Array.isArray(value)) return (value as NotificationItem[]).map(normalizeNotification);

  if (value && typeof value === "object") {
    const payload = value as Record<string, unknown>;
    const keys = ["items", "notifications", "data"];

    for (const key of keys) {
      const nested = payload[key];
      if (Array.isArray(nested)) {
        return (nested as NotificationItem[]).map(normalizeNotification);
      }
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
