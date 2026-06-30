/**
 * Stable discovery visibility checks.
 *
 * Determines whether a requester may view a stable in discovery contexts using
 * `Stable.isPublic` plus ownership/collaboration/relationship context.
 */

import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";

export type StableDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseStableRelationship?: boolean;
  hasActiveCollaboration?: boolean;
};

export function canViewStableDiscovery(
  stable: Record<string, unknown>,
  context: StableDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, stable);

  if (isOwner) {
    return true;
  }

  const isPublic = stable.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return (
    context.hasAcceptedHorseStableRelationship === true ||
    context.hasActiveCollaboration === true
  );
}
