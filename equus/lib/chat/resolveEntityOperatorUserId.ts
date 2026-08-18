/**
 * Resolve the operator User id for an entity-sourced Planning event.
 *
 * v1: stable events use `mainOwnerUserId`.
 */

import mongoose from "mongoose";

import Stable from "@/models/Stable.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { isDocumentActive } from "@/lib/lifecycle/activeQuery.ts";

export async function resolveEntityOperatorUserId(
  sourceEntityType: string | undefined,
  sourceEntityId: string | undefined,
): Promise<string | undefined> {
  if (!sourceEntityType || !sourceEntityId) {
    return undefined;
  }

  if (!mongoose.Types.ObjectId.isValid(sourceEntityId)) {
    throw new ApiError(400, "Invalid source entity id", "VALIDATION_ERROR");
  }

  if (sourceEntityType === "stable") {
    const stable = await Stable.findById(sourceEntityId).select("mainOwnerUserId isActive").lean();
    if (!isDocumentActive(stable) || !stable?.mainOwnerUserId) {
      return undefined;
    }
    return String(stable.mainOwnerUserId);
  }

  return undefined;
}
