import { useCallback, useEffect, useMemo, useState } from "react";
import {
  notificationService,
  unwrapNotifications,
  unwrapUnreadCount,
} from "../services/notification.service";
import type { NotificationItem } from "../types/notification";

export function useNotifications(enabled = true) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    try {
      const [listRes, countRes] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);

      setItems(unwrapNotifications(listRes?.data ?? listRes));
      setUnreadCount(unwrapUnreadCount(countRes?.data ?? countRes));
    } catch {
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      await notificationService.markAsRead(id);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isRead: true, read: true } : item,
        ),
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setItems((prev) =>
      prev.map((item) => ({ ...item, isRead: true, read: true })),
    );
    setUnreadCount(0);
  }, []);

  const unreadItems = useMemo(
    () => items.filter((item) => !(item.isRead || item.read)),
    [items],
  );

  return {
    items,
    unreadItems,
    unreadCount,
    loading,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
