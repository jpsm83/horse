/**
 * Breeder discovery visibility checks.
 *
 * Determines whether a requester may view a breeder in discovery contexts using
 * `Breeder.isPublic` plus ownership/collaboration/relationship context.
 */

import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";

export type BreederDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseBreederRelationship?: boolean;
  hasActiveCollaboration?: boolean;
};

export function canViewBreederDiscovery(
  breeder: Record<string, unknown>,
  context: BreederDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, breeder);

  if (isOwner) {
    return true;
  }

  const isPublic = breeder.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return (
    context.hasAcceptedHorseBreederRelationship === true ||
    context.hasActiveCollaboration === true
  );
}
