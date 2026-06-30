/**
 * Groom discovery visibility checks.
 *
 * Determines whether a requester may view a groom in discovery contexts using
 * `Groom.isPublic` plus profile ownership and horse relationship context.
 */

import { userOwnsGroomProfile } from "@/lib/grooms/userLinkedProfileAccess.ts";

export type GroomDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseGroomRelationship?: boolean;
};

export function canViewGroomDiscovery(
  groom: Record<string, unknown>,
  context: GroomDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsGroomProfile(requesterUserId, groom);

  if (isOwner) {
    return true;
  }

  const isPublic = groom.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return context.hasAcceptedHorseGroomRelationship === true;
}
