/**
 * Horse two-layer visibility — single source of truth for audiences and checks.
 *
 * Layer 1: `Horse.profileVisibility` — can the viewer open Hub / public card?
 * Layer 2: `Horse.hubSections[key].mode` — which Hub blocks appear?
 *
 * Modes (both layers): `public` | `relationship` | `owner`
 * Nested inclusion: owner ⊆ relationship ⊆ public
 *
 * Audience:
 * - owner team: main owner + co-owners + responsibles (`userOwnsEntity`)
 * - relationship: owner team + accepted horse Relationship + active workplace
 *   collaborators on related host entity profiles (stable / breeder / transport / ridingClub)
 */

import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import {
  DEFAULT_HUB_SECTIONS,
  normalizeHubSections,
  type HubSectionKey,
} from "@/lib/horses/hubSections.ts";
import type { VisibilityMode } from "@/lib/visibility/sectionVisibility.ts";
import { businessRoleTypeEnums } from "@/utils/enums.ts";

export type HorseVisibilityMode = VisibilityMode;

export type HorseViewerAudience = {
  isOwnerTeam: boolean;
  isRelationshipAudience: boolean;
};

/** Host entity account types that can have workplace collaborators on horse relationships. */
export const HORSE_HOST_COLLABORATOR_ACCOUNT_TYPES = businessRoleTypeEnums;

type HorseVisibilityDoc = Record<string, unknown>;

/**
 * Media / HorseEvent still store legacy item modes (`entities`).
 * Map to Layer-2 vocabulary before audience checks.
 */
export function normalizeItemVisibilityMode(
  mode: string | undefined | null,
): string {
  if (mode === "entities") return "relationship";
  if (mode === "owner_only") return "owner";
  return mode ?? "public";
}

export function canAccessByVisibilityMode(
  mode: HorseVisibilityMode | string | undefined,
  audience: HorseViewerAudience,
): boolean {
  const resolved = normalizeItemVisibilityMode(mode as string | undefined);
  // Legacy alias from pre-migration documents (also handled in normalize)
  if (resolved === "owner_only") {
    return audience.isOwnerTeam;
  }

  switch (resolved) {
    case "public":
      return true;
    case "relationship":
      return audience.isOwnerTeam || audience.isRelationshipAudience;
    case "owner":
      return audience.isOwnerTeam;
    default:
      return false;
  }
}

/** Item-level media/event visibility using the same audience nesting as Layer 2. */
export function canAccessByItemVisibilityMode(
  mode: string | undefined | null,
  audience: HorseViewerAudience,
): boolean {
  return canAccessByVisibilityMode(normalizeItemVisibilityMode(mode), audience);
}

export function canViewHorseGlobal(
  horse: HorseVisibilityDoc,
  audience: HorseViewerAudience,
): boolean {
  return canAccessByVisibilityMode(
    horse.profileVisibility as string | undefined,
    audience,
  );
}

/** Layer 1 deny — same shape as “not found” for public reads. */
export function assertCanViewHorseGlobal(
  horse: HorseVisibilityDoc,
  audience: HorseViewerAudience,
): void {
  if (!canViewHorseGlobal(horse, audience)) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }
}

export function canViewHorseHubSection(
  horse: HorseVisibilityDoc,
  sectionKey: HubSectionKey,
  audience: HorseViewerAudience,
): boolean {
  const sections = normalizeHubSections(
    horse.hubSections as Parameters<typeof normalizeHubSections>[0],
  );
  const mode = sections[sectionKey]?.mode ?? DEFAULT_HUB_SECTIONS[sectionKey].mode;
  return canAccessByVisibilityMode(mode, audience);
}

/**
 * True when the user has an active workplace collaboration on any accepted
 * host-entity relationship linked to the horse (stable / breeder / transport / ridingClub).
 */
export async function hasActiveHorseHostCollaboration(
  userId: string,
  horseId: string,
): Promise<boolean> {
  const hostingRelationships = await Relationship.find({
    horseId,
    status: "accepted",
    receiverAccountType: { $in: [...HORSE_HOST_COLLABORATOR_ACCOUNT_TYPES] },
    receiverAccountId: { $ne: null },
  })
    .select("receiverAccountType receiverAccountId")
    .lean();

  if (hostingRelationships.length === 0) {
    return false;
  }

  const orClauses = hostingRelationships
    .filter((entry) => entry.receiverAccountId != null && entry.receiverAccountType)
    .map((entry) => ({
      hostRoleType: entry.receiverAccountType as string,
      hostRoleProfileId: entry.receiverAccountId,
    }));

  if (orClauses.length === 0) {
    return false;
  }

  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    status: "active",
    active: true,
    $or: orClauses,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function hasAcceptedHorseRelationship(
  userId: string,
  horseId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    horseId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

/**
 * Resolve viewer audience for a horse (Layer 1 + Layer 2 shared context).
 * Guests / missing userId → both flags false (public-only access).
 */
export async function resolveHorseViewerAudience(
  horse: HorseVisibilityDoc,
  userId?: string | null,
): Promise<HorseViewerAudience> {
  if (!userId) {
    return { isOwnerTeam: false, isRelationshipAudience: false };
  }

  const isOwnerTeam = userOwnsEntity(userId, horse);
  if (isOwnerTeam) {
    return { isOwnerTeam: true, isRelationshipAudience: true };
  }

  const horseId = horse._id != null ? String(horse._id) : "";
  if (!horseId) {
    return { isOwnerTeam: false, isRelationshipAudience: false };
  }

  const [hasRelationship, hasCollaboration] = await Promise.all([
    hasAcceptedHorseRelationship(userId, horseId),
    hasActiveHorseHostCollaboration(userId, horseId),
  ]);

  const isRelationshipAudience = hasRelationship || hasCollaboration;
  return { isOwnerTeam: false, isRelationshipAudience };
}
