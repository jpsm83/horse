/**
 * Soft-deactivation audit fields for top-level Mongoose collections.
 *
 * Product rule: domain documents are never hard-deleted in user-facing flows.
 * Spread into parent schemas via `...deactivationAuditFields`.
 *
 * Nested embeds (pricing tiers, fleet vehicles) may use their own `isActive`
 * for catalog enable/disable — do not spread this object into those embeds.
 *
 * See `documentation/dataLifecycle.md` and `equus/documentation/dataLifecycle.md`.
 */

import { Schema } from "mongoose";

export const deactivationAuditFields = {
  isActive: { type: Boolean, default: true },
  deactivatedAt: { type: Date, default: undefined },
  deactivatedByUserId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: undefined,
  },
  deactivationReason: { type: String, default: undefined },
} as const;
