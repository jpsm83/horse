/**
 * Horse discovery visibility checks.
 *
 * Determines whether a requester may view a horse in discovery contexts using
 * `Horse.profileVisibility` plus ownership/relationship context.
 */

import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";

type HorseDiscoveryVisibility = "public" | "relationship" | "owner_only";

export type HorseDiscoveryRequesterContext = {
  requesterUserId?: string;
  isAuthenticated?: boolean;
  hasAcceptedRelationship?: boolean;
  hasActiveCollaboration?: boolean;
};

export function canViewHorseDiscovery(
  horse: Record<string, unknown>,
  context: HorseDiscoveryRequesterContext,
): boolean {
  const visibility = (horse.profileVisibility ?? "public") as HorseDiscoveryVisibility;
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, horse);

  if (isOwner) {
    return true;
  }

  switch (visibility) {
    case "public":
      return true;
    case "relationship":
      return context.hasAcceptedRelationship === true || context.hasActiveCollaboration === true;
    case "owner_only":
      return false;
    default:
      return false;
  }
}

