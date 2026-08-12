/**
 * Breeder service — creation, discovery/public-read flows, owned list, and the
 * role-aware breeder view shared by the web UI.
 *
 * Called by `/api/v1/breeders` routes. Route handlers stay thin; ownership and
 * discovery rules live here.
 */

import mongoose from "mongoose";
import Breeder from "@/models/Breeder.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery, userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import {
  canViewBreederDiscovery,
  type BreederDiscoveryRequesterContext,
} from "@/lib/breeders/breederDiscoveryAccess.ts";
import {
  buildPublicBreederCard,
  type PublicBreederCard,
} from "@/lib/breeders/buildPublicBreederCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createBreederSchema,
  updateBreederDiscoverySchema,
  updateBreederProfileSchema,
} from "@/lib/validations/breeder.ts";

export type CreateBreederInput = z.infer<typeof createBreederSchema>;
export type UpdateBreederDiscoveryInput = z.infer<typeof updateBreederDiscoverySchema>;
export type UpdateBreederProfileInput = z.infer<typeof updateBreederProfileSchema>;

export type { PublicBreederCard };

// --- Role-aware view types ---

export type BreederTab = "hub" | "profile" | "admin";

export type BreederViewerRole =
  | "main_owner"
  | "co_owner"
  | "related"
  | "public"
  | "guest";

/** Role-scoped breeder view DTO for the shared detail chrome. */
export type BreederViewDto = {
  id: string;
  operationName: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  imageUrl?: string;
  legalName?: string;
  disciplines?: string[];
  bloodlines?: string[];
  address?: {
    city?: string;
    country?: string;
    state?: string;
    street?: string;
    postCode?: string;
    buildingNumber?: string;
  };
  isPublic?: boolean;
  isMainOwner?: boolean;
  isCoOwner?: boolean;
  isAdmin?: boolean;
};

export type BreederViewResponse = {
  viewerRole: BreederViewerRole;
  allowedTabs: BreederTab[];
  breeder: BreederViewDto;
};

// --- List types ---

export type BreederListItem = {
  id: string;
  operationName: string;
  city?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  disciplines?: string[];
  bloodlines?: string[];
  isPublic?: boolean;
  updatedAt?: string;
};

export type BreederListResult = {
  breeders: BreederListItem[];
  total: number;
  page: number;
  limit: number;
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseBreederRelationship(
  userId: string,
  breederId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "breeder",
    receiverAccountType: "breeder",
    receiverAccountId: breederId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function hasActiveBreederCollaboration(
  userId: string,
  breederId: string,
): Promise<boolean> {
  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType: "breeder",
    hostRoleProfileId: breederId,
    status: "active",
    active: true,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function createBreeder(actorUserId: string, input: CreateBreederInput) {
  ensureObjectId(actorUserId, "user id");

  const breeder = await Breeder.create({
    mainOwnerUserId: actorUserId,
    operationName: input.operationName,
    description: input.description,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.bloodlines ? { bloodlines: input.bloodlines } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
  });

  return breeder.toObject();
}

export async function updateBreederDiscovery(
  actorUserId: string,
  breederId: string,
  input: UpdateBreederDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(breederId, "breeder id");

  const breeder = await Breeder.findOne({
    _id: breederId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!breeder) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    breeder.isPublic = input.isPublic;
  }

  await breeder.save();
  return breeder.toObject();
}

export async function getBreederForOwner(actorUserId: string, breederId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(breederId, "breeder id");

  const breeder = await Breeder.findOne({
    _id: breederId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!breeder) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }
  return breeder as Record<string, unknown>;
}

export async function getPublicBreederCard(
  breederId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicBreederCard> {
  ensureObjectId(breederId, "breeder id");

  const breeder = await Breeder.findById(breederId).lean();
  if (!breeder) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(breeder as Record<string, unknown>, "Breeder");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId
      ? await hasAcceptedHorseBreederRelationship(requesterUserId, breederId)
      : false;
  const hasCollaboration =
    requesterUserId ? await hasActiveBreederCollaboration(requesterUserId, breederId) : false;

  const visibilityContext: BreederDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseBreederRelationship: hasRelationship,
    hasActiveCollaboration: hasCollaboration,
  };

  if (!canViewBreederDiscovery(breeder as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }

  return buildPublicBreederCard(breeder as Record<string, unknown>);
}

/**
 * Owner profile update — dirty-field PATCH via `$set` / `$unset`.
 * Only fields present in the parsed input are touched; empty strings unset the
 * field (see equus/docs/engineering/profile.md). Nested `address.*` fields are flattened.
 */
export async function updateBreederProfile(
  actorUserId: string,
  breederId: string,
  input: UpdateBreederProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(breederId, "breeder id");

  const breeder = await Breeder.findOne({
    _id: breederId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!breeder) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
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

  const updated = await Breeder.findByIdAndUpdate(breederId, updateOps, { new: true }).lean();
  if (!updated) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

// --- Role derivation ---

export const BREEDER_ROLE_ORDER: BreederViewerRole[] = [
  "guest",
  "public",
  "related",
  "co_owner",
  "main_owner",
];

export const BREEDER_TAB_MIN_ROLE: Record<BreederTab, BreederViewerRole> = {
  hub: "guest",
  profile: "related",
  admin: "main_owner",
};

function deriveBreederViewerRole(
  breeder: Record<string, unknown>,
  userId?: string | null,
): BreederViewerRole {
  if (!userId) return "guest";
  if (String(breeder.mainOwnerUserId) === userId) return "main_owner";
  const isCoOwner = (Array.isArray(breeder.coOwners) ? breeder.coOwners : []).some(
    (c: { userId?: unknown }) => c.userId != null && String(c.userId) === userId,
  );
  if (isCoOwner) return "co_owner";
  return "public";
}

export function deriveBreederAllowedTabs(viewerRole: BreederViewerRole): BreederTab[] {
  const roleIndex = BREEDER_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(BREEDER_TAB_MIN_ROLE) as BreederTab[]).filter((tab) => {
    const minIndex = BREEDER_ROLE_ORDER.indexOf(BREEDER_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- List ---

function toBreederListItem(doc: Record<string, unknown>): BreederListItem {
  const address = (doc.address ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    operationName: doc.operationName as string,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    description: doc.description as string | undefined,
    imageUrl: doc.imageUrl as string | undefined,
    disciplines: doc.disciplines as string[] | undefined,
    bloodlines: doc.bloodlines as string[] | undefined,
    isPublic: doc.isPublic as boolean | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

/** List breeders owned by the authenticated user ("my breeders"). */
export async function listBreedersForOwner(
  actorUserId: string,
  page = 1,
  limit = 20,
): Promise<BreederListResult> {
  ensureObjectId(actorUserId, "user id");
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const query = { ...ownedByUserQuery(actorUserId), isActive: { $ne: false } };
  const [docs, total] = await Promise.all([
    Breeder.find(query).sort({ updatedAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Breeder.countDocuments(query),
  ]);

  return {
    breeders: (docs as unknown as Record<string, unknown>[]).map(toBreederListItem),
    total,
    page: safePage,
    limit: safeLimit,
  };
}

function toBreederView(breeder: Record<string, unknown>): BreederViewDto {
  const address = (breeder.address ?? {}) as Record<string, unknown>;
  return {
    id: String(breeder._id),
    operationName: breeder.operationName as string,
    description: breeder.description as string | undefined,
    email: breeder.email as string | undefined,
    phoneNumber: breeder.phoneNumber as string | undefined,
    imageUrl: breeder.imageUrl as string | undefined,
    legalName: breeder.legalName as string | undefined,
    disciplines: breeder.disciplines as string[] | undefined,
    bloodlines: breeder.bloodlines as string[] | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    isPublic: breeder.isPublic as boolean | undefined,
  };
}

/**
 * Unified role-aware breeder view — single endpoint for all breeder tabs.
 * Returns the role-scoped breeder, the viewer's role, and accessible tabs.
 */
export async function getBreederView(
  breederId: string,
  userId?: string | null,
): Promise<BreederViewResponse> {
  ensureObjectId(breederId, "breeder id");

  const breeder = await Breeder.findById(breederId).lean();
  if (!breeder) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(breeder as Record<string, unknown>, "Breeder");

  const breederDoc = breeder as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, breederDoc);

  if (!isOwner && breederDoc.isPublic === false) {
    const hasRelationship = requesterUserId
      ? await hasAcceptedHorseBreederRelationship(requesterUserId, breederId)
      : false;
    const hasCollaboration = requesterUserId
      ? await hasActiveBreederCollaboration(requesterUserId, breederId)
      : false;
    if (!hasRelationship && !hasCollaboration) {
      throw new ApiError(404, "Breeder not found", "NOT_FOUND");
    }
  }

  const viewerRole = deriveBreederViewerRole(breederDoc, userId);
  const allowedTabs = deriveBreederAllowedTabs(viewerRole);

  const view = toBreederView(breederDoc);
  if (isOwner && requesterUserId) {
    const isMainOwner = String(breederDoc.mainOwnerUserId) === requesterUserId;
    const isCoOwner = (Array.isArray(breederDoc.coOwners) ? breederDoc.coOwners : []).some(
      (c: { userId?: unknown }) => c.userId != null && String(c.userId) === requesterUserId,
    );
    view.isMainOwner = isMainOwner;
    view.isCoOwner = isCoOwner;
    view.isAdmin = isMainOwner || isCoOwner;
  }

  return { viewerRole, allowedTabs, breeder: view };
}
