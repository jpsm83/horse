import { describe, expect, it, vi } from "vitest";

import Horse from "@/models/Horse.ts";
import Notification from "@/models/Notification.ts";
import * as userService from "@/lib/services/userService.ts";
import { processWaitingTransferNags } from "@/lib/jobs/processWaitingTransferNags.ts";
import { createTestStable } from "@/models/__tests__/helpers/businessRoleFixtures.ts";

vi.mock("@/lib/email/sendWaitingTransferNagEmail.ts", () => ({
  sendWaitingTransferNagEmail: vi.fn().mockResolvedValue(undefined),
}));

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Nag",
  });
}

describe("processWaitingTransferNags", () => {
  it("nags horses whose last nag was 4+ days ago and skips recent nags", async () => {
    const stableOwner = await createUser("nag-stable@example.com");
    const stable = await createTestStable(stableOwner._id);
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

    const dueHorse = await Horse.create({
      name: "Due Nag",
      breed: "Thoroughbred",
      sex: "Mare",
      mainOwnerUserId: stableOwner._id,
      createdByUserId: stableOwner._id,
      waitingTransfer: {
        active: true,
        invitedOwnerEmail: "due-owner@example.com",
        hostStableId: stable._id,
        createdAt: fourDaysAgo,
        nagLastSentAt: fourDaysAgo,
      },
    });

    const recentHorse = await Horse.create({
      name: "Recent Nag",
      breed: "Thoroughbred",
      sex: "Gelding",
      mainOwnerUserId: stableOwner._id,
      createdByUserId: stableOwner._id,
      waitingTransfer: {
        active: true,
        invitedOwnerEmail: "recent-owner@example.com",
        hostStableId: stable._id,
        createdAt: oneDayAgo,
        nagLastSentAt: oneDayAgo,
      },
    });

    const result = await processWaitingTransferNags();

    expect(result.processed).toBe(1);

    const notifications = await Notification.find({
      notificationType: "waiting_transfer",
      horseId: dueHorse._id,
    });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0]?.metadata).toMatchObject({ pushPending: true });

    const recentNotifications = await Notification.countDocuments({
      notificationType: "waiting_transfer",
      horseId: recentHorse._id,
    });
    expect(recentNotifications).toBe(0);

    const reloadedDue = await Horse.findById(dueHorse._id).lean();
    const reloadedRecent = await Horse.findById(recentHorse._id).lean();
    expect(
      (reloadedDue as Record<string, unknown>).waitingTransfer as { nagLastSentAt?: Date },
    ).toBeDefined();
    expect(
      new Date(
        ((reloadedDue as Record<string, unknown>).waitingTransfer as { nagLastSentAt: Date })
          .nagLastSentAt,
      ).getTime(),
    ).toBeGreaterThan(fourDaysAgo.getTime());

    expect(
      (
        (reloadedRecent as Record<string, unknown>).waitingTransfer as {
          nagLastSentAt: Date;
        }
      ).nagLastSentAt.getTime(),
    ).toBe(oneDayAgo.getTime());
  });
});
