import { notificationService } from "../../services/notification.service";
import type { CreateNotificationPayload } from "../../types/notification";

type NotificationTriggerKey =
  | "ORG_VERIFICATION_REVIEWED"
  | "ORG_VERIFICATION_SUBMITTED"
  | "ORG_CREATED"
  | "ORG_UPDATED"
  | "EVENT_CREATED"
  | "EVENT_UPDATED"
  | "EVENT_CANCELLED"
  | "ORDER_CREATED"
  | "REPORT_REVIEWED"
  | "REPORT_BULK_SPAM";

type NotificationContext = {
  orgName?: string;
  eventTitle?: string;
  reportReason?: string;
  status?: string;
  count?: number;
  total?: number;
};

const NOTIFICATION_TRIGGER_CONFIG: Record<
  NotificationTriggerKey,
  {
    enabled: boolean;
    buildPayload: (context: NotificationContext) => CreateNotificationPayload;
  }
> = {
  ORG_VERIFICATION_REVIEWED: {
    enabled: true,
    buildPayload: ({ orgName, status }) => ({
      type: "ORGANIZATION",
      title: "Organization verification updated",
      message: `${orgName || "Organization"} verification was ${String(status || "updated").toLowerCase()}.`,
    }),
  },
  ORG_VERIFICATION_SUBMITTED: {
    enabled: true,
    buildPayload: ({ orgName }) => ({
      type: "ORGANIZATION",
      title: "Organization verification submitted",
      message: `${orgName || "An organization"} submitted a verification request.`,
    }),
  },
  ORG_CREATED: {
    enabled: true,
    buildPayload: ({ orgName }) => ({
      type: "ORGANIZATION",
      title: "New organization created",
      message: `${orgName || "An organization"} was created.`,
    }),
  },
  ORG_UPDATED: {
    enabled: true,
    buildPayload: ({ orgName }) => ({
      type: "ORGANIZATION",
      title: "Organization updated",
      message: `${orgName || "An organization"} profile was updated.`,
    }),
  },
  EVENT_CREATED: {
    enabled: true,
    buildPayload: ({ eventTitle, orgName }) => ({
      type: "EVENT",
      title: "New event created",
      message: `${eventTitle || "An event"}${orgName ? ` for ${orgName}` : ""} was created.`,
    }),
  },
  EVENT_UPDATED: {
    enabled: true,
    buildPayload: ({ eventTitle }) => ({
      type: "EVENT",
      title: "Event updated",
      message: `${eventTitle || "An event"} was updated.`,
    }),
  },
  EVENT_CANCELLED: {
    enabled: true,
    buildPayload: ({ count }) => ({
      type: "EVENT",
      title: "Event cancelled",
      message: `${count || 0} event${count === 1 ? "" : "s"} were cancelled.`,
    }),
  },
  ORDER_CREATED: {
    enabled: true,
    buildPayload: ({ eventTitle, count, total }) => ({
      type: "ORDER",
      title: "New ticket order",
      message: `${count || 0} ticket${count === 1 ? "" : "s"} ordered${eventTitle ? ` for ${eventTitle}` : ""}${total ? ` · ${new Intl.NumberFormat("vi-VN").format(total)} đ` : ""}.`,
    }),
  },
  REPORT_REVIEWED: {
    enabled: true,
    buildPayload: ({ orgName, status }) => ({
      type: "REPORT",
      title: "Report reviewed",
      message: `Report${orgName ? ` for ${orgName}` : ""} was marked as ${String(status || "reviewed").toLowerCase()}.`,
    }),
  },
  REPORT_BULK_SPAM: {
    enabled: true,
    buildPayload: ({ count }) => ({
      type: "REPORT",
      title: "Reports marked as spam",
      message: `${count || 0} report${count === 1 ? "" : "s"} were marked as spam.`,
    }),
  },
};

export async function triggerNotification(
  key: NotificationTriggerKey,
  context: NotificationContext = {},
) {
  const config = NOTIFICATION_TRIGGER_CONFIG[key];
  if (!config?.enabled) return;

  try {
    await notificationService.createNotification(config.buildPayload(context));
  } catch {
    return;
  }
}
