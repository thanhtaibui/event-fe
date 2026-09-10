import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "../../hooks/useNotifications";
import type { NotificationItem } from "../../types/notification";

type Props = {
  className?: string;
  variant?: "user" | "admin";
  enabled?: boolean;
};

function getNotificationTitle(item: NotificationItem) {
  return item.title || item.type || "Notification";
}

function getNotificationMessage(item: NotificationItem) {
  return item.message || item.content || "You have a new update.";
}

function getNotificationTime(item: NotificationItem) {
  if (!item.createdAt) return "";
  const date = new Date(item.createdAt);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationMenu({
  className = "",
  variant = "user",
  enabled = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    items,
    unreadCount,
    loading,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications(enabled);
  const prefix =
    variant === "admin"
      ? "eventixNotification eventixNotification--admin"
      : "eventixNotification eventixNotification--user";

  useEffect(() => {
    if (!open) return;
    refetch();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, refetch]);

  const handleItemClick = async (item: NotificationItem) => {
    if (!(item.isRead || item.read)) {
      await markAsRead(item.id);
    }
  };

  return (
    <div className={`${prefix} ${className}`} ref={rootRef}>
      <button
        type="button"
        className="eventixNotification__trigger"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <Bell size={17} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="eventixNotification__badge" aria-label={`${unreadCount} unread notifications`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`eventixNotification__menu ${
          open ? "eventixNotification__menu--open" : ""
        }`}
      >
        <div className="eventixNotification__head">
          <div>
            <strong>Notifications</strong>
            <small>{unreadCount} unread</small>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={!unreadCount}
          >
            Mark all read
          </button>
        </div>

        <div className="eventixNotification__list">
          {loading && (
            <div className="eventixNotification__empty">Loading updates...</div>
          )}
          {!loading && items.length === 0 && (
            <div className="eventixNotification__empty">
              No notifications yet.
            </div>
          )}
          {!loading &&
            items.map((item) => {
              const unread = !(item.isRead || item.read);
              return (
                <button
                  type="button"
                  className={`eventixNotification__item ${
                    unread ? "eventixNotification__item--unread" : ""
                  }`}
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                >
                  <span className="eventixNotification__dot" />
                  <span className="eventixNotification__content">
                    <strong>{getNotificationTitle(item)}</strong>
                    <small>{getNotificationMessage(item)}</small>
                    {getNotificationTime(item) && (
                      <em>{getNotificationTime(item)}</em>
                    )}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </div>
  );
}
