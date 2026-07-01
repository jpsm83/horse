/**
 * Horse subscription billing — payer of record on `Horse.subscription` (H-BILL-03).
 *
 * Main owner is the default payer. Called by `horseService.createHorse` and
 * `ownershipTransferService` when `transfer_main` is accepted on a horse.
 */

import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import { ApiError } from "@/lib/api/errors.ts";

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

/** Set initial payer when a horse is created (main owner). */
export async function assignInitialHorseSubscriptionPayer(
  horseId: string,
  payerUserId: string,
): Promise<void> {
  ensureObjectId(horseId, "horse id");
  ensureObjectId(payerUserId, "payer user id");

  const updated = await Horse.findOneAndUpdate(
    { _id: horseId },
    { $set: { "subscription.payerUserId": payerUserId } },
  );

  if (!updated) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }
}

/**
 * Reassign subscription payer when `transfer_main` accept sets a new `mainOwnerUserId`.
 * Subscription status, trial window, and referral attribution stay on the horse.
 */
export async function reassignHorseSubscriptionPayerAfterTransferMain(
  horseId: string,
  newPayerUserId: string,
): Promise<void> {
  ensureObjectId(horseId, "horse id");
  ensureObjectId(newPayerUserId, "payer user id");

  const updated = await Horse.findOneAndUpdate(
    { _id: horseId },
    { $set: { "subscription.payerUserId": newPayerUserId } },
    { returnDocument: "after" },
  );

  if (!updated) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const subscription = (updated as { subscription?: { payerUserId?: unknown } }).subscription;
  if (String(subscription?.payerUserId) !== newPayerUserId) {
    throw new ApiError(500, "Failed to reassign horse subscription payer", "INTERNAL_ERROR");
  }
}
