/**
 * Payment gating — blocks horse data access when subscription is past_due.
 *
 * Called by:
 * - Stripe webhook handler (invoice.payment_failed → block, invoice.payment_succeeded → restore)
 * - On-access middleware (optional, for real-time enforcement)
 */

import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";

/** Grace period in days after subscription period ends before data is blocked */
const GRACE_PERIOD_DAYS = 14;

/**
 * Check if a user is past the grace period and block horse data access if so.
 */
export async function applyPaymentGate(userId: string): Promise<void> {
  const user = await User.findById(userId)
    .select("subscription.status subscription.currentPeriodEnd")
    .lean();

  if (!user || user.subscription?.status !== "past_due") return;

  const periodEnd = user.subscription?.currentPeriodEnd;
  if (!periodEnd) return;

  const overGracePeriod =
    Date.now() > periodEnd.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

  if (overGracePeriod) {
    await Horse.updateMany(
      {
        mainOwnerUserId: new mongoose.Types.ObjectId(userId),
        "registration.isActive": true,
      },
      { $set: { "registration.dataAvailability": "payment_blocked" } },
    );
  }
}

/**
 * Restore data access for all horses owned by a user after successful payment.
 */
export async function restorePaymentAccess(userId: string): Promise<void> {
  await Horse.updateMany(
    { mainOwnerUserId: new mongoose.Types.ObjectId(userId) },
    { $set: { "registration.dataAvailability": "available" } },
  );
}
