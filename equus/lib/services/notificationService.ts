/**
 * Notification service — create, paginated list, and mark-as-read.
 *
 * `createNotification` is called by media/document deletion services to emit
 * notifications. `listNotifications` / `markNotificationAsRead` back the inbox
 * at `GET /api/v1/notifications` and `PATCH /api/v1/notifications/:id/read`.
 * Inbox queries target the current user in `recipientUserIds`, exclude inactive
 * tombstones, and derive `isRead` from the user's presence in `readByUserIds`.
 */

import mongoose from "mongoose";

import Notification from "@/models/Notification.ts";
import * as enums from "../../utils/enums.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { mergeActiveOnly } from "@/lib/lifecycle/activeQuery.ts";

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

export type NotificationListItem = {
  id: string;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResult = {
  notifications: NotificationListItem[];
  total: number;
  page: number;
  totalPages: number;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

type NotificationLeanDoc = {
  _id: mongoose.Types.ObjectId;
  notificationType: string;
  title: string;
  message: string;
  actionUrl?: string;
  readByUserIds?: mongoose.Types.ObjectId[];
  createdAt?: Date;
};

function toNotificationListItem(doc: NotificationLeanDoc, userId: string): NotificationListItem {
  return {
    id: String(doc._id),
    notificationType: doc.notificationType,
    title: doc.title,
    message: doc.message,
    actionUrl: doc.actionUrl,
    isRead: (doc.readByUserIds ?? []).some((id) => String(id) === userId),
    createdAt: doc.createdAt ? doc.createdAt.toISOString() : new Date(0).toISOString(),
  };
}

export async function listNotifications(
  userId: string,
  page = 1,
  limit = DEFAULT_PAGE_SIZE,
): Promise<NotificationListResult> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(limit) || DEFAULT_PAGE_SIZE));
  const userIdObj = new mongoose.Types.ObjectId(userId);

  const [total, docs] = await Promise.all([
    Notification.countDocuments(mergeActiveOnly({ recipientUserIds: userIdObj })),
    Notification.find(mergeActiveOnly({ recipientUserIds: userIdObj }))
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
  ]);

  return {
    notifications: docs.map((doc) =>
      toNotificationListItem(doc as unknown as NotificationLeanDoc, userId),
    ),
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function markNotificationAsRead(
  userId: string,
  notificationId: string,
): Promise<void> {
  const userIdObj = new mongoose.Types.ObjectId(userId);

  const result = await Notification.updateOne(
    {
      _id: notificationId,
      recipientUserIds: userIdObj,
      ...mergeActiveOnly({}),
    },
    { $addToSet: { readByUserIds: userIdObj } },
  );

  if (result.matchedCount === 0) {
    throw new ApiError(404, "Notification not found", "NOT_FOUND");
  }
}
