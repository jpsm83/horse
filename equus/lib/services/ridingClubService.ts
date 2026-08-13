/**
 * Riding club service — creation, discovery/public-read, role-aware views, and
 * owner profile/list flows.
 *
 * Called by `/api/v1/riding-clubs` routes. Route handlers stay thin; ownership and
 * discovery rules live here.
 */

import mongoose from "mongoose";
import RidingClub from "@/models/RidingClub.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery, userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createRidingClubSchema,
  updateRidingClubDiscoverySchema,
  updateRidingClubProfileSchema,
} from "@/lib/validations/ridingClub.ts";

export type CreateRidingClubInput = z.infer<typeof createRidingClubSchema>;
export type UpdateRidingClubDiscoveryInput = z.infer<typeof updateRidingClubDiscoverySchema>;
export type UpdateRidingClubProfileInput = z.infer<typeof updateRidingClubProfileSchema>;

// --- Role-aware view types ---

export type RidingClubTab = "hub" | "profile" | "admin";

export type RidingClubViewerRole =
  | "main_owner"
  | "co_owner"
  | "related"
  | "public"
  | "guest";

/** Role-scoped riding club view DTO for the shared detail chrome. */
export type RidingClubViewDto = {
  id: string;
  clubName: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  disciplines?: string[];
  facilities?: string[];
  membershipInfo?: string;
  membershipFee?: number;
  address?: {
    city?: string;
    country?: string;
    state?: string;
    street?: string;
    postCode?: string;
    buildingNumber?: string;
  };
  isPublic?: boolean;
  acceptsNewMembers?: boolean;
  isMainOwner?: boolean;
  isCoOwner?: boolean;
  isAdmin?: boolean;
};

export type RidingClubViewResponse = {
  viewerRole: RidingClubViewerRole;
  allowedTabs: RidingClubTab[];
  ridingClub: RidingClubViewDto;
};

// --- List types ---

export type RidingClubListItem = {
  id: string;
  clubName: string;
  city?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  disciplines?: string[];
  isPublic?: boolean;
  acceptsNewMembers?: boolean;
  updatedAt?: string;
};

export type RidingClubListResult = {
  ridingClubs: RidingClubListItem[];
  total: number;
  page: number;
  limit: number;
};

// --- Role derivation ---

export const RIDING_CLUB_ROLE_ORDER: RidingClubViewerRole[] = [
  "guest",
  "public",
  "related",
  "co_owner",
  "main_owner",
];

export const RIDING_CLUB_TAB_MIN_ROLE: Record<RidingClubTab, RidingClubViewerRole> = {
  hub: "guest",
  profile: "related",
  admin: "main_owner",
};

function deriveRidingClubViewerRole(
  ridingClub: Record<string, unknown>,
  userId?: string | null,
  hasRelatedAccess = false,
): RidingClubViewerRole {
  if (!userId) return "guest";
  if (String(ridingClub.mainOwnerUserId) === userId) return "main_owner";
  const isCoOwner = (Array.isArray(ridingClub.coOwners) ? ridingClub.coOwners : []).some(
    (c: { userId?: unknown }) => c.userId != null && String(c.userId) === userId,
  );
  if (isCoOwner) return "co_owner";
  if (hasRelatedAccess) return "related";
  return "public";
}

export function deriveRidingClubAllowedTabs(viewerRole: RidingClubViewerRole): RidingClubTab[] {
  const roleIndex = RIDING_CLUB_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(RIDING_CLUB_TAB_MIN_ROLE) as RidingClubTab[]).filter((tab) => {
    const minIndex = RIDING_CLUB_ROLE_ORDER.indexOf(RIDING_CLUB_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseRidingClubRelationship(
  userId: string,
  ridingClubId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "ridingClub",
    receiverAccountType: "ridingClub",
    receiverAccountId: ridingClubId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function hasActiveRidingClubCollaboration(
  userId: string,
  ridingClubId: string,
): Promise<boolean> {
  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType: "ridingClub",
    hostRoleProfileId: ridingClubId,
    status: "active",
    active: true,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function createRidingClub(actorUserId: string, input: CreateRidingClubInput) {
  ensureObjectId(actorUserId, "user id");

  const ridingClub = await RidingClub.create({
    mainOwnerUserId: actorUserId,
    clubName: input.clubName,
    description: input.description,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.facilities ? { facilities: input.facilities } : {}),
    ...(input.membershipInfo ? { membershipInfo: input.membershipInfo } : {}),
    ...(input.membershipFee !== undefined ? { membershipFee: input.membershipFee } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewMembers !== undefined
      ? { acceptsNewMembers: input.acceptsNewMembers }
      : {}),
  });

  return ridingClub.toObject();
}

export async function updateRidingClubDiscovery(
  actorUserId: string,
  ridingClubId: string,
  input: UpdateRidingClubDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(ridingClubId, "riding club id");

  const ridingClub = await RidingClub.findOne({
    _id: ridingClubId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!ridingClub) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    ridingClub.isPublic = input.isPublic;
  }

  if (input.acceptsNewMembers !== undefined) {
    ridingClub.acceptsNewMembers = input.acceptsNewMembers;
  }

  await ridingClub.save();
  return ridingClub.toObject();
}

export async function getRidingClubForOwner(actorUserId: string, ridingClubId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(ridingClubId, "riding club id");

  const ridingClub = await RidingClub.findOne({
    _id: ridingClubId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!ridingClub) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }
  return ridingClub as Record<string, unknown>;
}

/**
 * Owner/co-owner profile update — dirty-field PATCH built from the validated
 * input. Empty strings become `$unset` (optional clears); address is flattened
 * onto `address.*` keys so partial address edits never wipe other subfields.
 */
export async function updateRidingClubProfile(
  actorUserId: string,
  ridingClubId: string,
  input: UpdateRidingClubProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(ridingClubId, "riding club id");

  const ridingClub = await RidingClub.findOne({
    _id: ridingClubId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!ridingClub) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
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

  const updated = await RidingClub.findByIdAndUpdate(ridingClubId, updateOps, { new: true }).lean();
  if (!updated) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

// --- List ---

function toRidingClubListItem(doc: Record<string, unknown>): RidingClubListItem {
  const address = (doc.address ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    clubName: doc.clubName as string,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    description: doc.description as string | undefined,
    imageUrl: doc.imageUrl as string | undefined,
    disciplines: doc.disciplines as string[] | undefined,
    isPublic: doc.isPublic as boolean | undefined,
    acceptsNewMembers: doc.acceptsNewMembers as boolean | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

/** List riding clubs owned by the authenticated user ("my riding clubs"). */
export async function listRidingClubsForOwner(
  actorUserId: string,
  page = 1,
  limit = 20,
): Promise<RidingClubListResult> {
  ensureObjectId(actorUserId, "user id");
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const query = { ...ownedByUserQuery(actorUserId), isActive: { $ne: false } };
  const [docs, total] = await Promise.all([
    RidingClub.find(query).sort({ updatedAt: -1 }).skip(skip).limit(safeLimit).lean(),
    RidingClub.countDocuments(query),
  ]);

  return {
    ridingClubs: (docs as unknown as Record<string, unknown>[]).map(toRidingClubListItem),
    total,
    page: safePage,
    limit: safeLimit,
  };
}

// --- Unified role-aware view ---

function toRidingClubView(ridingClub: Record<string, unknown>): RidingClubViewDto {
  const address = (ridingClub.address ?? {}) as Record<string, unknown>;
  return {
    id: String(ridingClub._id),
    clubName: ridingClub.clubName as string,
    description: ridingClub.description as string | undefined,
    email: ridingClub.email as string | undefined,
    phoneNumber: ridingClub.phoneNumber as string | undefined,
    disciplines: ridingClub.disciplines as string[] | undefined,
    facilities: ridingClub.facilities as string[] | undefined,
    membershipInfo: ridingClub.membershipInfo as string | undefined,
    membershipFee: ridingClub.membershipFee as number | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    isPublic: ridingClub.isPublic as boolean | undefined,
    acceptsNewMembers: ridingClub.acceptsNewMembers as boolean | undefined,
  };
}

/**
 * Unified role-aware riding club view — single endpoint for all club tabs.
 * Returns the role-scoped club, the viewer's role, and accessible tabs.
 */
export async function getRidingClubView(
  clubId: string,
  userId?: string | null,
): Promise<RidingClubViewResponse> {
  ensureObjectId(clubId, "riding club id");

  const ridingClub = await RidingClub.findById(clubId).lean();
  if (!ridingClub) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(ridingClub as Record<string, unknown>, "Riding club");

  const clubDoc = ridingClub as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, clubDoc);

  const hasRelationship = requesterUserId
    ? await hasAcceptedHorseRidingClubRelationship(requesterUserId, clubId)
    : false;
  const hasCollaboration = requesterUserId
    ? await hasActiveRidingClubCollaboration(requesterUserId, clubId)
    : false;

  if (!isOwner && clubDoc.isPublic === false && !hasRelationship && !hasCollaboration) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }

  const viewerRole = deriveRidingClubViewerRole(
    clubDoc,
    userId,
    hasRelationship || hasCollaboration,
  );
  const allowedTabs = deriveRidingClubAllowedTabs(viewerRole);

  const view = toRidingClubView(clubDoc);
  if (isOwner && requesterUserId) {
    const isMainOwner = String(clubDoc.mainOwnerUserId) === requesterUserId;
    const isCoOwner = (Array.isArray(clubDoc.coOwners) ? clubDoc.coOwners : []).some(
      (c: { userId?: unknown }) => c.userId != null && String(c.userId) === requesterUserId,
    );
    view.isMainOwner = isMainOwner;
    view.isCoOwner = isCoOwner;
    view.isAdmin = isMainOwner || isCoOwner;
  }

  return { viewerRole, allowedTabs, ridingClub: view };
}
