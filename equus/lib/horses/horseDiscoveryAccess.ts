/**
 * Horse discovery visibility — thin compatibility layer over horseVisibilityAccess.
 *
 * Prefer `canViewHorseGlobal` + `resolveHorseViewerAudience` for new code.
 */

import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import {
  canViewHorseGlobal,
  type HorseViewerAudience,
} from "@/lib/horses/horseVisibilityAccess.ts";

export type HorseDiscoveryRequesterContext = {
  requesterUserId?: string;
  isAuthenticated?: boolean;
  hasAcceptedRelationship?: boolean;
  hasActiveCollaboration?: boolean;
  /** When provided, used directly instead of deriving from flags. */
  audience?: HorseViewerAudience;
};

function audienceFromContext(
  horse: Record<string, unknown>,
  context: HorseDiscoveryRequesterContext,
): HorseViewerAudience {
  if (context.audience) {
    return context.audience;
  }

  const requesterUserId = context.requesterUserId;
  const isOwnerTeam =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, horse);

  const isRelationshipAudience =
    isOwnerTeam ||
    context.hasAcceptedRelationship === true ||
    context.hasActiveCollaboration === true;

  return { isOwnerTeam, isRelationshipAudience };
}

/** Prefer canViewHorseGlobal + resolveHorseViewerAudience for new code. */
export function canViewHorseDiscovery(
  horse: Record<string, unknown>,
  context: HorseDiscoveryRequesterContext,
): boolean {
  return canViewHorseGlobal(horse, audienceFromContext(horse, context));
}

export { canViewHorseGlobal } from "@/lib/horses/horseVisibilityAccess.ts";
