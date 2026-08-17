/**
 * Stable roster meter — counts horses currently hosted by a stable.
 *
 * Used for catalog band suggestions only; adding a horse does not auto-change Stripe.
 * Waiting-transfer horses are greenfield — only accepted relationships count today.
 */

import mongoose from "mongoose";
import Relationship from "@/models/Relationship.ts";

export async function countStableRoster(stableId: string): Promise<number> {
  if (!mongoose.Types.ObjectId.isValid(stableId)) return 0;

  return Relationship.countDocuments({
    receiverAccountType: "stable",
    receiverAccountId: new mongoose.Types.ObjectId(stableId),
    status: "accepted",
  });
}
