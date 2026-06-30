/**
 * Entity ownership helpers — mainOwnerUserId + coOwners[] on host entities.
 *
 * Used by navigationService, workplaceRelationshipService, businessRoleProfile,
 * and requireRoleProfileAccess.
 */

import mongoose from "mongoose";
import type { BusinessRoleType } from "../roleProfiles/businessRoleProfile.ts";

type CoOwnerEntry = { userId?: unknown };

/** Mongo filter: user is main owner or listed in coOwners[]. */
export function ownedByUserQuery(userId: string): Record<string, unknown> {
  const objectId = new mongoose.Types.ObjectId(userId);
  return {
    $or: [{ mainOwnerUserId: objectId }, { "coOwners.userId": objectId }],
  };
}

/** True when userId is mainOwnerUserId or in coOwners[]. */
export function userOwnsEntity(userId: string, profile: Record<string, unknown>): boolean {
  if (profile.mainOwnerUserId != null && String(profile.mainOwnerUserId) === userId) {
    return true;
  }

  const coOwners = profile.coOwners as CoOwnerEntry[] | undefined;
  return coOwners?.some((entry) => entry.userId != null && String(entry.userId) === userId) ?? false;
}

/** Main operator id for billing/display on entity-owned host profiles. */
export function resolveMainOwnerUserId(
  _roleType: BusinessRoleType,
  profile: Record<string, unknown>,
): string | null {
  const mainOwnerUserId = profile.mainOwnerUserId;
  return mainOwnerUserId != null ? String(mainOwnerUserId) : null;
}

/** Whether the user has owner-level access (main or co-owner) on a host entity profile. */
export function userHasOwnerAccess(
  _roleType: BusinessRoleType,
  userId: string,
  profile: Record<string, unknown>,
): boolean {
  return userOwnsEntity(userId, profile);
}
