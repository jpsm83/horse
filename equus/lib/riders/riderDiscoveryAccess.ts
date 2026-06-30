/**
 * Rider discovery visibility checks.
 *
 * Determines whether a requester may view a rider in discovery contexts using
 * `Rider.isPublic` plus profile ownership and horse relationship context.
 */

import { userOwnsRiderProfile } from "@/lib/riders/userLinkedProfileAccess.ts";

export type RiderDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseRiderRelationship?: boolean;
};

export function canViewRiderDiscovery(
  rider: Record<string, unknown>,
  context: RiderDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsRiderProfile(requesterUserId, rider);

  if (isOwner) {
    return true;
  }

  const isPublic = rider.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return context.hasAcceptedHorseRiderRelationship === true;
}
