/**
 * Waiting-transfer service — inbox list and party notifications.
 */

import mongoose from "mongoose";

import Horse from "@/models/Horse.ts";
import Stable from "@/models/Stable.ts";
import User from "@/models/User.ts";
import OwnershipTransfer from "@/models/OwnershipTransfer.ts";
import { buildLocalizedAppLink } from "@/i18n/appLinks.ts";
import { sendWaitingTransferNagEmail } from "@/lib/email/sendWaitingTransferNagEmail.ts";
import { createNotification } from "@/lib/services/notificationService.ts";

export type WaitingTransferHorseItem = {
  horseId: string;
  horseName: string;
  hostStableId: string;
  hostStableName?: string;
  invitedOwnerEmail: string;
  role: "provisional_owner" | "invited_owner";
  ownershipTransferId?: string;
  createdAt: string;
};

async function findPendingTransfer(horseId: string, invitedEmail: string) {
  return OwnershipTransfer.findOne({
    entityType: "horse",
    entityId: horseId,
    transferKind: "transfer_main",
    status: "pending",
    invitedEmail: invitedEmail.toLowerCase().trim(),
  })
    .select("_id")
    .lean();
}

export async function notifyWaitingTransferParties(input: {
  horseId: string;
  horseName: string;
  provisionalOwnerUserId: string;
  invitedOwnerEmail: string;
  ownershipTransferId?: string;
}): Promise<void> {
  const invitedEmail = input.invitedOwnerEmail.toLowerCase().trim();
  const invitedUser = await User.findOne({ "personalDetails.email": invitedEmail })
    .select("_id personalDetails.preferredLanguage")
    .lean();

  const provisionalUser = await User.findById(input.provisionalOwnerUserId)
    .select("personalDetails.email personalDetails.preferredLanguage")
    .lean();

  const provisionalEmail = (
    provisionalUser as Record<string, unknown> | null
  )?.personalDetails as { email?: string; preferredLanguage?: string } | undefined;

  const connectUrl = buildLocalizedAppLink(
    provisionalEmail?.preferredLanguage,
    `horses/${input.horseId}/connect`,
  );

  await createNotification({
    recipientUserIds: [input.provisionalOwnerUserId],
    notificationType: "waiting_transfer",
    title: "Waiting transfer pending",
    message: `Ownership of ${input.horseName} is pending claim by ${invitedEmail}.`,
    horseId: input.horseId,
    actionUrl: connectUrl,
    metadata: { pushPending: true, role: "provisional_owner" },
  });

  if (provisionalEmail?.email) {
    await sendWaitingTransferNagEmail({
      locale: provisionalEmail.preferredLanguage,
      to: provisionalEmail.email,
      horseName: input.horseName,
      horseId: input.horseId,
      role: "provisional_owner",
      ownershipTransferId: input.ownershipTransferId,
    });
  }

  if (invitedUser) {
    const invitedRecord = invitedUser as Record<string, unknown>;
    const invitedDetails = invitedRecord.personalDetails as
      | { preferredLanguage?: string }
      | undefined;
    const ownershipUrl = buildLocalizedAppLink(
      invitedDetails?.preferredLanguage,
      "ownership-transfers",
      input.ownershipTransferId ? { transfer: input.ownershipTransferId } : {},
    );

    await createNotification({
      recipientUserIds: [String(invitedRecord._id)],
      notificationType: "waiting_transfer",
      title: "Horse ownership invitation",
      message: `You have been invited to become the owner of ${input.horseName}.`,
      horseId: input.horseId,
      actionUrl: ownershipUrl,
      metadata: { pushPending: true, role: "invited_owner" },
    });

    await sendWaitingTransferNagEmail({
      locale: invitedDetails?.preferredLanguage,
      to: invitedEmail,
      horseName: input.horseName,
      horseId: input.horseId,
      role: "invited_owner",
      ownershipTransferId: input.ownershipTransferId,
    });
  }
}

export async function listWaitingTransferHorsesForUser(
  userId: string,
  email: string,
): Promise<WaitingTransferHorseItem[]> {
  const normalizedEmail = email.toLowerCase().trim();
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const provisionalHorses = await Horse.find({
    mainOwnerUserId: userObjectId,
    "waitingTransfer.active": true,
  }).lean();

  const invitedHorses = await Horse.find({
    "waitingTransfer.active": true,
    "waitingTransfer.invitedOwnerEmail": normalizedEmail,
    mainOwnerUserId: { $ne: userObjectId },
  }).lean();

  const items: WaitingTransferHorseItem[] = [];

  for (const doc of provisionalHorses) {
    const record = doc as Record<string, unknown>;
    const waiting = record.waitingTransfer as Record<string, unknown>;
    const hostStableId = String(waiting.hostStableId);
    const invitedOwnerEmail = String(waiting.invitedOwnerEmail);
    const stable = await Stable.findById(hostStableId).select("tradeName").lean();
    const transfer = await findPendingTransfer(String(record._id), invitedOwnerEmail);

    items.push({
      horseId: String(record._id),
      horseName: String(record.name ?? ""),
      hostStableId,
      hostStableName: stable ? String((stable as Record<string, unknown>).tradeName ?? "") : undefined,
      invitedOwnerEmail,
      role: "provisional_owner",
      ownershipTransferId: transfer ? String((transfer as Record<string, unknown>)._id) : undefined,
      createdAt: (waiting.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    });
  }

  for (const doc of invitedHorses) {
    const record = doc as Record<string, unknown>;
    const waiting = record.waitingTransfer as Record<string, unknown>;
    const hostStableId = String(waiting.hostStableId);
    const invitedOwnerEmail = String(waiting.invitedOwnerEmail);
    const transfer = await findPendingTransfer(String(record._id), invitedOwnerEmail);
    if (!transfer) {
      continue;
    }

    const stable = await Stable.findById(hostStableId).select("tradeName").lean();
    items.push({
      horseId: String(record._id),
      horseName: String(record.name ?? ""),
      hostStableId,
      hostStableName: stable ? String((stable as Record<string, unknown>).tradeName ?? "") : undefined,
      invitedOwnerEmail,
      role: "invited_owner",
      ownershipTransferId: String((transfer as Record<string, unknown>)._id),
      createdAt: (waiting.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    });
  }

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
