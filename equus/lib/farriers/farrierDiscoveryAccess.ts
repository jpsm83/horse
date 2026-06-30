/**
 * Farrier discovery visibility checks.
 *
 * Determines whether a requester may view a farrier in discovery contexts using
 * `Farrier.isPublic` plus profile ownership and horse relationship context.
 */

import { userOwnsFarrierProfile } from "@/lib/farriers/userLinkedProfileAccess.ts";

export type FarrierDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseFarrierRelationship?: boolean;
};

export function canViewFarrierDiscovery(
  farrier: Record<string, unknown>,
  context: FarrierDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsFarrierProfile(requesterUserId, farrier);

  if (isOwner) {
    return true;
  }

  const isPublic = farrier.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return context.hasAcceptedHorseFarrierRelationship === true;
}
