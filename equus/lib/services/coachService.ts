/**
 * Coach service — creation, discovery/public-read flows, role-aware view, and
 * profile update.
 *
 * Called by `/api/v1/coaches` routes. Route handlers stay thin; user-linked
 * ownership (`Coach.userId`) and discovery rules live here.
 */

import mongoose from "mongoose";
import Coach from "@/models/Coach.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsCoachProfile } from "@/lib/coaches/userLinkedProfileAccess.ts";
import {
  canViewCoachDiscovery,
  type CoachDiscoveryRequesterContext,
} from "@/lib/coaches/coachDiscoveryAccess.ts";
import {
  buildPublicCoachCard,
  type PublicCoachCard,
} from "@/lib/coaches/buildPublicCoachCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createCoachSchema,
  updateCoachDiscoverySchema,
  updateCoachProfileSchema,
} from "@/lib/validations/coach.ts";

export type CreateCoachInput = z.infer<typeof createCoachSchema>;
export type UpdateCoachDiscoveryInput = z.infer<typeof updateCoachDiscoverySchema>;
export type UpdateCoachProfileInput = z.infer<typeof updateCoachProfileSchema>;

export type { PublicCoachCard };

// --- Role-aware view types ---

export type CoachTab = "hub" | "profile";

export type CoachViewerRole = "owner" | "related" | "public" | "guest";

/** Role-scoped coach view DTO for the shared detail chrome. */
export type CoachViewDto = {
  id: string;
  displayName: string;
  bio?: string;
  email?: string;
  phoneNumber?: string;
  legalName?: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
    street?: string;
    postCode?: string;
    buildingNumber?: string;
  };
  disciplines?: string[];
  competitionLevels?: string[];
  preparationServices?: string[];
  experienceYears?: number;
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  isOwner?: boolean;
};

export type CoachViewResponse = {
  viewerRole: CoachViewerRole;
  allowedTabs: CoachTab[];
  coach: CoachViewDto;
};

// --- List types ---

export type CoachListItem = {
  id: string;
  displayName: string;
  city?: string;
  country?: string;
  bio?: string;
  disciplines?: string[];
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  updatedAt?: string;
};

export type CoachListResult = {
  coaches: CoachListItem[];
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseCoachRelationship(
  userId: string,
  coachId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "coach",
    receiverAccountType: "coach",
    receiverAccountId: coachId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

export async function createCoach(actorUserId: string, input: CreateCoachInput) {
  ensureObjectId(actorUserId, "user id");

  const user = await User.findById(actorUserId).select("coachProfileId").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }
  if (user.coachProfileId) {
    throw new ApiError(409, "Coach profile already exists for this user", "CONFLICT");
  }

  const coach = await Coach.create({
    userId: actorUserId,
    displayName: input.displayName,
    bio: input.bio,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.competitionLevels ? { competitionLevels: input.competitionLevels } : {}),
    ...(input.preparationServices ? { preparationServices: input.preparationServices } : {}),
    ...(input.experienceYears !== undefined ? { experienceYears: input.experienceYears } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewClients !== undefined
      ? { acceptsNewClients: input.acceptsNewClients }
      : {}),
  });

  const linked = await User.findOneAndUpdate(
    { _id: actorUserId, coachProfileId: { $exists: false } },
    { coachProfileId: coach._id },
    { returnDocument: "after" },
  ).select("coachProfileId");

  if (!linked) {
    await Coach.findByIdAndDelete(coach._id);
    throw new ApiError(409, "Coach profile already exists for this user", "CONFLICT");
  }

  return coach.toObject();
}

export async function updateCoachDiscovery(
  actorUserId: string,
  coachId: string,
  input: UpdateCoachDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(coachId, "coach id");

  const coach = await Coach.findOne({ _id: coachId, userId: actorUserId });
  if (!coach) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    coach.isPublic = input.isPublic;
  }

  if (input.acceptsNewClients !== undefined) {
    coach.acceptsNewClients = input.acceptsNewClients;
  }

  await coach.save();
  return coach.toObject();
}

export async function getCoachForOwner(actorUserId: string, coachId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(coachId, "coach id");

  const coach = await Coach.findOne({ _id: coachId, userId: actorUserId }).lean();
  if (!coach) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }
  return coach as Record<string, unknown>;
}

export async function getPublicCoachCard(
  coachId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicCoachCard> {
  ensureObjectId(coachId, "coach id");

  const coach = await Coach.findById(coachId).lean();
  if (!coach) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(coach as Record<string, unknown>, "Coach");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId ? await hasAcceptedHorseCoachRelationship(requesterUserId, coachId) : false;

  const visibilityContext: CoachDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseCoachRelationship: hasRelationship,
  };

  if (!canViewCoachDiscovery(coach as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  return buildPublicCoachCard(coach as Record<string, unknown>);
}

// --- Role derivation ---

export const COACH_ROLE_ORDER: CoachViewerRole[] = [
  "guest",
  "public",
  "related",
  "owner",
];

export const COACH_TAB_MIN_ROLE: Record<CoachTab, CoachViewerRole> = {
  hub: "guest",
  profile: "owner",
};

function deriveCoachViewerRole(
  coach: Record<string, unknown>,
  userId?: string | null,
  hasRelationship = false,
): CoachViewerRole {
  if (!userId) return "guest";
  if (userOwnsCoachProfile(userId, coach)) return "owner";
  if (hasRelationship) return "related";
  return "public";
}

export function deriveCoachAllowedTabs(viewerRole: CoachViewerRole): CoachTab[] {
  const roleIndex = COACH_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(COACH_TAB_MIN_ROLE) as CoachTab[]).filter((tab) => {
    const minIndex = COACH_ROLE_ORDER.indexOf(COACH_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- List ---

function toCoachListItem(doc: Record<string, unknown>): CoachListItem {
  const address = (doc.address ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    displayName: doc.displayName as string,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    bio: doc.bio as string | undefined,
    disciplines: doc.disciplines as string[] | undefined,
    isPublic: doc.isPublic as boolean | undefined,
    acceptsNewClients: doc.acceptsNewClients as boolean | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

/** List the coach profile owned by the authenticated user (max one). */
export async function listCoachesForOwner(actorUserId: string): Promise<CoachListResult> {
  ensureObjectId(actorUserId, "user id");
  const query = { userId: actorUserId, isActive: { $ne: false } };
  const docs = await Coach.find(query).sort({ updatedAt: -1 }).lean();
  return {
    coaches: (docs as unknown as Record<string, unknown>[]).map(toCoachListItem),
  };
}

// --- View ---

function toCoachView(coach: Record<string, unknown>): CoachViewDto {
  const address = (coach.address ?? {}) as Record<string, unknown>;
  return {
    id: String(coach._id),
    displayName: coach.displayName as string,
    bio: coach.bio as string | undefined,
    email: coach.email as string | undefined,
    phoneNumber: coach.phoneNumber as string | undefined,
    legalName: coach.legalName as string | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    disciplines: coach.disciplines as string[] | undefined,
    competitionLevels: coach.competitionLevels as string[] | undefined,
    preparationServices: coach.preparationServices as string[] | undefined,
    experienceYears: coach.experienceYears as number | undefined,
    isPublic: coach.isPublic as boolean | undefined,
    acceptsNewClients: coach.acceptsNewClients as boolean | undefined,
  };
}

/**
 * Unified role-aware coach view — single endpoint for all coach tabs.
 * Returns the role-scoped coach, the viewer's role, and accessible tabs.
 * `isOwner` is set when `coach.userId === userId`.
 */
export async function getCoachView(
  coachId: string,
  userId?: string | null,
): Promise<CoachViewResponse> {
  ensureObjectId(coachId, "coach id");

  const coach = await Coach.findById(coachId).lean();
  if (!coach) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(coach as Record<string, unknown>, "Coach");

  const coachDoc = coach as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsCoachProfile(requesterUserId, coachDoc);

  const hasRelationship = requesterUserId
    ? await hasAcceptedHorseCoachRelationship(requesterUserId, coachId)
    : false;

  if (!isOwner && coachDoc.isPublic === false && !hasRelationship) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  const viewerRole = deriveCoachViewerRole(coachDoc, userId, hasRelationship);
  const allowedTabs = deriveCoachAllowedTabs(viewerRole);

  const view = toCoachView(coachDoc);
  if (isOwner) {
    view.isOwner = true;
  }

  return { viewerRole, allowedTabs, coach: view };
}

/**
 * Owner profile update — dirty-field PATCH built from the validated input.
 * Empty strings become `$unset` (optional clears); address is flattened onto
 * `address.*` keys so partial address edits never wipe other subfields.
 * Requires `coach.userId === actorUserId`.
 */
export async function updateCoachProfile(
  actorUserId: string,
  coachId: string,
  input: UpdateCoachProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(coachId, "coach id");

  const coach = await Coach.findOne({ _id: coachId, userId: actorUserId });
  if (!coach) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  const updates: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;

    if (key === "address") {
      if (typeof value === "object" && value !== null) {
        for (const [addrKey, addrValue] of Object.entries(value)) {
          if (addrValue !== undefined) {
            updates[`address.${addrKey}`] = addrValue;
          }
        }
      }
      continue;
    }

    if (typeof value === "string" && value.trim() === "") {
      unset[key] = 1;
      continue;
    }

    updates[key] = value;
  }

  const updateOps: Record<string, unknown> = {};
  if (Object.keys(updates).length > 0) updateOps.$set = updates;
  if (Object.keys(unset).length > 0) updateOps.$unset = unset;

  const updated = await Coach.findByIdAndUpdate(coachId, updateOps, { new: true }).lean();
  if (!updated) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

export { userOwnsCoachProfile };
