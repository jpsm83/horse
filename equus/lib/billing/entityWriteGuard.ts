/**
 * Entity write guard — blocks stable mutating routes when subscription is not in good standing.
 *
 * Ops APIs (roster, whiteboard, …) will use the same helper when they ship. Profile
 * and discovery PATCH on Stable are gated here per billing.md Target.
 */

import Stable from "@/models/Stable.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { isEntityInGoodStanding, type EntitySubscriptionFields } from "./entitySubscription.ts";

export async function assertStableWriteAllowed(stableId: string): Promise<void> {
  const stable = await Stable.findById(stableId).select("subscription").lean();
  if (!stable) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }

  const sub = (stable as { subscription?: EntitySubscriptionFields }).subscription;
  if (!isEntityInGoodStanding(sub)) {
    throw new ApiError(
      403,
      "Stable subscription is not in good standing. Update billing to continue editing.",
      "SUBSCRIPTION_WRITE_LOCKED",
    );
  }
}
