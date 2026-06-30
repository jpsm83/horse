/**
 * Veterinary discovery visibility checks.
 *
 * Determines whether a requester may view a veterinary profile in discovery contexts
 * using `Veterinary.isPublic` plus profile ownership and horse relationship context.
 */

import { userOwnsVeterinaryProfile } from "@/lib/veterinaries/userLinkedProfileAccess.ts";

export type VeterinaryDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseVeterinaryRelationship?: boolean;
};

export function canViewVeterinaryDiscovery(
  veterinary: Record<string, unknown>,
  context: VeterinaryDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsVeterinaryProfile(requesterUserId, veterinary);

  if (isOwner) {
    return true;
  }

  const isPublic = veterinary.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return context.hasAcceptedHorseVeterinaryRelationship === true;
}
