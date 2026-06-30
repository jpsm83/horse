/**
 * Coach discovery visibility checks.
 *
 * Determines whether a requester may view a coach in discovery contexts using
 * `Coach.isPublic` plus profile ownership and horse relationship context.
 */

import { userOwnsCoachProfile } from "@/lib/coaches/userLinkedProfileAccess.ts";

export type CoachDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseCoachRelationship?: boolean;
};

export function canViewCoachDiscovery(
  coach: Record<string, unknown>,
  context: CoachDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsCoachProfile(requesterUserId, coach);

  if (isOwner) {
    return true;
  }

  const isPublic = coach.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return context.hasAcceptedHorseCoachRelationship === true;
}
