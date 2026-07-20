/**
 * Entity ownership helpers — mainOwnerUserId + coOwners[] + responsibles[] on host entities.
 *
 * Used by navigationService, workplaceRelationshipService, businessRoleProfile,
 * and requireRoleProfileAccess.
 */

import mongoose from "mongoose";
import type { BusinessRoleType } from "../roleProfiles/businessRoleProfile.ts";

type ArrayEntry = { userId?: unknown };

/** Mongo filter: user is main owner, co-owner, or responsible person. */
export function ownedByUserQuery(userId: string): Record<string, unknown> {
  const objectId = new mongoose.Types.ObjectId(userId);
  return {
    $or: [
      { mainOwnerUserId: objectId },
      { "coOwners.userId": objectId },
      { "responsibles.userId": objectId },
    ],
  };
}

/** True when userId is mainOwnerUserId, in coOwners[], or in responsibles[]. */
export function userOwnsEntity(userId: string, profile: Record<string, unknown>): boolean {
  if (profile.mainOwnerUserId != null && String(profile.mainOwnerUserId) === userId) {
    return true;
  }

  const coOwners = profile.coOwners as ArrayEntry[] | undefined;
  if (coOwners?.some((entry) => entry.userId != null && String(entry.userId) === userId)) {
    return true;
  }

  const responsibles = profile.responsibles as ArrayEntry[] | undefined;
  return responsibles?.some((entry) => entry.userId != null && String(entry.userId) === userId) ?? false;
}

/** Main operator id for billing/display on entity-owned host profiles. */
export function resolveMainOwnerUserId(
  _roleType: BusinessRoleType,
  profile: Record<string, unknown>,
): string | null {
  const mainOwnerUserId = profile.mainOwnerUserId;
  return mainOwnerUserId != null ? String(mainOwnerUserId) : null;
}

/** Whether the user has owner-level access (main, co-owner, or responsible) on a host entity profile. */
export function userHasOwnerAccess(
  _roleType: BusinessRoleType,
  userId: string,
  profile: Record<string, unknown>,
): boolean {
  return userOwnsEntity(userId, profile);
}
