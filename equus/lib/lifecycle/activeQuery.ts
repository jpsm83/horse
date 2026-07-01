/**
 * Active-only query helpers — tombstone filtering per dataLifecycle.md.
 *
 * Used by discoverService, entity *Service public reads, navigationService, and
 * workplace list paths. Owner get-by-id flows intentionally omit this filter so
 * operators can still open inactive records for future reactivation.
 */

import type { Model } from "mongoose";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";

/** Mongo filter: document is not tombstoned (`isActive !== false`). */
export const activeOnlyFilter = { isActive: { $ne: false } } as const;

export function mergeActiveOnly<T extends Record<string, unknown>>(
  filter: T,
): T & typeof activeOnlyFilter {
  return { ...filter, ...activeOnlyFilter };
}

export function isDocumentActive(
  doc: { isActive?: boolean } | null | undefined,
): boolean {
  return doc != null && doc.isActive !== false;
}

export function assertDocumentActive(
  doc: { isActive?: boolean } | null | undefined,
  notFoundLabel = "Resource",
): asserts doc is NonNullable<typeof doc> {
  if (!isDocumentActive(doc)) {
    throw new ApiError(404, `${notFoundLabel} not found`, "NOT_FOUND");
  }
}

function resolveOperatorUserId(doc: Record<string, unknown>): string | undefined {
  if (doc.mainOwnerUserId != null) {
    return String(doc.mainOwnerUserId);
  }
  if (doc.userId != null) {
    return String(doc.userId);
  }
  return undefined;
}

/** Block public/discovery read when the operator account is deactivated. */
export async function assertOperatorUserActive(
  operatorUserId: string | undefined,
): Promise<void> {
  if (!operatorUserId) {
    return;
  }

  const user = await User.findById(operatorUserId).select("isActive").lean();
  if (!isDocumentActive(user)) {
    throw new ApiError(404, "Not found", "NOT_FOUND");
  }
}

/** Entity tombstone + operator account check for public card endpoints. */
export async function assertPublicReadAllowed(
  doc: Record<string, unknown> | null | undefined,
  notFoundLabel: string,
): Promise<Record<string, unknown>> {
  assertDocumentActive(doc, notFoundLabel);
  await assertOperatorUserActive(resolveOperatorUserId(doc));
  return doc;
}

export async function isEntityActiveById(
  Model: Model<unknown>,
  entityId: string,
): Promise<boolean> {
  const doc = await Model.findById(entityId).select("isActive").lean();
  return isDocumentActive(doc as { isActive?: boolean } | null | undefined);
}

/** Load operator user ids that are still active (batch for discover). */
export async function filterActiveOperatorUserIds(
  operatorUserIds: string[],
): Promise<Set<string>> {
  const uniqueIds = [...new Set(operatorUserIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return new Set();
  }

  const users = await User.find({
    _id: { $in: uniqueIds },
    ...activeOnlyFilter,
  })
    .select("_id")
    .lean();

  return new Set(users.map((user) => String(user._id)));
}

export async function profileLinkIsActive(
  Model: Model<unknown>,
  profileId: unknown,
): Promise<boolean> {
  if (profileId == null) {
    return false;
  }
  return (await Model.exists({ _id: profileId, ...activeOnlyFilter })) !== null;
}
