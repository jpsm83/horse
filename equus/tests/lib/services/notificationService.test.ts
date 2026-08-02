import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import Notification from "@/models/Notification";
import * as notificationService from "@/lib/services/notificationService";

describe("notificationService", () => {
  let userId: string;
  let otherUserId: string;

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId().toHexString();
    otherUserId = new mongoose.Types.ObjectId().toHexString();
  });

  describe("createNotification", () => {
    it("creates a notification document", async () => {
      await notificationService.createNotification({
        recipientUserIds: [userId],
        notificationType: "relationship",
        title: "New request",
        message: "Ada wants to connect.",
      });

      const count = await Notification.countDocuments();
      expect(count).toBe(1);
    });
  });

  describe("listNotifications", () => {
    it("returns notifications targeting the user with isRead derived from readByUserIds", async () => {
      await Notification.create([
        {
          recipientUserIds: [userId],
          notificationType: "relationship",
          title: "Unread",
          message: "First",
        },
        {
          recipientUserIds: [userId],
          notificationType: "system",
          title: "Read",
          message: "Second",
          readByUserIds: [userId],
        },
        {
          recipientUserIds: [otherUserId],
          notificationType: "system",
          title: "Not mine",
          message: "Third",
        },
      ]);

      const result = await notificationService.listNotifications(userId);

      expect(result.total).toBe(2);
      expect(result.notifications).toHaveLength(2);
      expect(result.notifications).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ title: "Unread", isRead: false }),
          expect.objectContaining({ title: "Read", isRead: true }),
        ]),
      );
    });

    it("paginates results", async () => {
      await Notification.create(
        Array.from({ length: 5 }, (_, i) => ({
          recipientUserIds: [userId],
          notificationType: "system",
          title: `N${i}`,
          message: `M${i}`,
        })),
      );

      const page1 = await notificationService.listNotifications(userId, 1, 2);
      const page2 = await notificationService.listNotifications(userId, 2, 2);

      expect(page1.notifications).toHaveLength(2);
      expect(page2.notifications).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page1.totalPages).toBe(3);
    });

    it("excludes inactive tombstones", async () => {
      await Notification.create({
        recipientUserIds: [userId],
        notificationType: "system",
        title: "Active",
        message: "M",
      });
      await Notification.create({
        recipientUserIds: [userId],
        notificationType: "system",
        title: "Tombstoned",
        message: "M",
        isActive: false,
      });

      const result = await notificationService.listNotifications(userId);
      expect(result.total).toBe(1);
      expect(result.notifications[0]!.title).toBe("Active");
    });
  });

  describe("markNotificationAsRead", () => {
    it("adds the user to readByUserIds", async () => {
      const created = await Notification.create({
        recipientUserIds: [userId],
        notificationType: "system",
        title: "T",
        message: "M",
      });

      await notificationService.markNotificationAsRead(userId, String(created._id));

      const doc = await Notification.findById(created._id).lean();
      expect(doc?.readByUserIds?.map(String)).toContain(userId);
    });

    it("throws 404 for a notification not targeting the user", async () => {
      const created = await Notification.create({
        recipientUserIds: [otherUserId],
        notificationType: "system",
        title: "T",
        message: "M",
      });

      await expect(
        notificationService.markNotificationAsRead(userId, String(created._id)),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
