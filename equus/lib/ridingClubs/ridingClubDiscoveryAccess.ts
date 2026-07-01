/**
 * Riding club discovery visibility checks.
 *
 * Determines whether a requester may view a riding club in discovery contexts
 * using `RidingClub.isPublic` plus ownership/collaboration/relationship context.
 */

import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";

export type RidingClubDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseRidingClubRelationship?: boolean;
  hasActiveCollaboration?: boolean;
};

export function canViewRidingClubDiscovery(
  ridingClub: Record<string, unknown>,
  context: RidingClubDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, ridingClub);

  if (isOwner) {
    return true;
  }

  const isPublic = ridingClub.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return (
    context.hasAcceptedHorseRidingClubRelationship === true ||
    context.hasActiveCollaboration === true
  );
}
