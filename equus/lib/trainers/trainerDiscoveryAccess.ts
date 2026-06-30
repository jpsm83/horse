/**
 * Trainer discovery visibility checks.
 *
 * Determines whether a requester may view a trainer in discovery contexts using
 * `Trainer.isPublic` plus profile ownership and horse relationship context.
 */

import { userOwnsTrainerProfile } from "@/lib/trainers/userLinkedProfileAccess.ts";

export type TrainerDiscoveryRequesterContext = {
  requesterUserId?: string;
  hasAcceptedHorseTrainerRelationship?: boolean;
};

export function canViewTrainerDiscovery(
  trainer: Record<string, unknown>,
  context: TrainerDiscoveryRequesterContext,
): boolean {
  const requesterUserId = context.requesterUserId;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsTrainerProfile(requesterUserId, trainer);

  if (isOwner) {
    return true;
  }

  const isPublic = trainer.isPublic !== false;
  if (isPublic) {
    return true;
  }

  return context.hasAcceptedHorseTrainerRelationship === true;
}
