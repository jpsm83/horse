import Notification from "@/models/Notification.ts";
import * as enums from "../../utils/enums.ts";

type NotificationType = (typeof enums.notificationTypeEnums)[number];

type CreateNotificationInput = {
  recipientUserIds: string[];
  senderUserId?: string;
  notificationType: NotificationType;
  title: string;
  message: string;
  horseId?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(
  input: CreateNotificationInput,
): Promise<void> {
  await Notification.create(input);
}
