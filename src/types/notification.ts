export type NotificationType =
  | "SYSTEM"
  | "ORGANIZATION"
  | "EVENT"
  | "ORDER"
  | "TICKET"
  | string;

export interface NotificationItem {
  id: string;
  title?: string;
  message?: string;
  content?: string;
  type?: NotificationType;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
}

export type CreateNotificationPayload = {
  title: string;
  message: string;
  type: NotificationType;
};
