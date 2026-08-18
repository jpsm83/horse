/**
 * Recurring job — 3-day waiting-transfer nag for provisional and invited owners.
 */

import Horse from "@/models/Horse.ts";
import OwnershipTransfer from "@/models/OwnershipTransfer.ts";
import { notifyWaitingTransferParties } from "@/lib/services/waitingTransferService.ts";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export type ProcessWaitingTransferNagsResult = {
  processed: number;
  skipped: number;
};

export async function processWaitingTransferNags(): Promise<ProcessWaitingTransferNagsResult> {
  const cutoff = new Date(Date.now() - THREE_DAYS_MS);

  const horses = await Horse.find({
    "waitingTransfer.active": true,
    $or: [
      { "waitingTransfer.nagLastSentAt": { $exists: false } },
      { "waitingTransfer.nagLastSentAt": null },
      { "waitingTransfer.nagLastSentAt": { $lte: cutoff } },
    ],
  }).lean();

  let processed = 0;
  let skipped = 0;

  for (const doc of horses) {
    const record = doc as Record<string, unknown>;
    const waiting = record.waitingTransfer as Record<string, unknown>;
    const nagLastSentAt = waiting.nagLastSentAt as Date | undefined;

    if (nagLastSentAt && nagLastSentAt > cutoff) {
      skipped += 1;
      continue;
    }

    const horseId = String(record._id);
    const horseName = String(record.name ?? "Horse");
    const invitedOwnerEmail = String(waiting.invitedOwnerEmail);
    const provisionalOwnerUserId = String(record.mainOwnerUserId);

    const transfer = await OwnershipTransfer.findOne({
      entityType: "horse",
      entityId: horseId,
      transferKind: "transfer_main",
      status: "pending",
      invitedEmail: invitedOwnerEmail.toLowerCase().trim(),
    })
      .select("_id")
      .lean();

    await notifyWaitingTransferParties({
      horseId,
      horseName,
      provisionalOwnerUserId,
      invitedOwnerEmail,
      ownershipTransferId: transfer
        ? String((transfer as Record<string, unknown>)._id)
        : undefined,
    });

    await Horse.updateOne(
      { _id: record._id },
      { $set: { "waitingTransfer.nagLastSentAt": new Date() } },
    );

    processed += 1;
  }

  return { processed, skipped };
}
