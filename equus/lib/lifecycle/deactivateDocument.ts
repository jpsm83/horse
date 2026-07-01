/**
 * Shared document deactivation — tombstone audit fields per dataLifecycle.md.
 *
 * Called by userService.softDelete and future entity deactivation flows.
 * Does not hard-delete; sets `isActive: false` plus audit fields via
 * `deactivationAuditFields` on models.
 */

import mongoose, { type Model } from "mongoose";
import { ApiError } from "@/lib/api/errors.ts";

export type DeactivateDocumentInput = {
  deactivatedByUserId: string;
  deactivationReason?: string;
  deactivatedAt?: Date;
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

/** Mongo `$set` payload for tombstone fields (merge with `mergeDeactivationUpdate`). */
export function buildDeactivationSet(input: DeactivateDocumentInput): Record<string, unknown> {
  const deactivatedAt = input.deactivatedAt ?? new Date();
  return {
    isActive: false,
    deactivatedAt,
    deactivatedByUserId: input.deactivatedByUserId,
    ...(input.deactivationReason !== undefined
      ? { deactivationReason: input.deactivationReason }
      : {}),
  };
}

/**
 * Merge tombstone `$set` with optional extra update operators (e.g. User `$inc`).
 * Shallow-merges top-level keys; deep-merges `$set` only.
 */
export function mergeDeactivationUpdate(
  input: DeactivateDocumentInput,
  additionalUpdate: Record<string, unknown> = {},
): Record<string, unknown> {
  const { $set: extraSet, ...rest } = additionalUpdate;

  return {
    ...rest,
    $set: {
      ...buildDeactivationSet(input),
      ...((extraSet as Record<string, unknown> | undefined) ?? {}),
    },
  };
}

export type DeactivateDocumentOptions = {
  select?: string;
  /** Extra Mongo operators merged with tombstone `$set` (e.g. `{ $inc: { refreshSessionVersion: 1 } }`). */
  additionalUpdate?: Record<string, unknown>;
  runValidators?: boolean;
};

/** Tombstone a document by id; returns updated lean doc or null when missing. */
export async function deactivateDocument(
  Model: Model<unknown>,
  documentId: string,
  input: DeactivateDocumentInput,
  options: DeactivateDocumentOptions = {},
): Promise<Record<string, unknown> | null> {
  ensureObjectId(documentId, "document id");
  ensureObjectId(input.deactivatedByUserId, "deactivated by user id");

  const doc = await Model.findByIdAndUpdate(
    documentId,
    mergeDeactivationUpdate(input, options.additionalUpdate),
    {
      returnDocument: "after",
      runValidators: options.runValidators ?? false,
    },
  )
    .select(options.select ?? "")
    .lean();

  if (!doc) {
    return null;
  }

  return doc as Record<string, unknown>;
}
