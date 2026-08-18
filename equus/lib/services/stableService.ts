/**
 * Stable service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/stables` routes. Route handlers stay thin; ownership and
 * discovery rules live here.
 */

import mongoose from "mongoose";
import Stable from "@/models/Stable.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery, userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import { buildDefaultEntitySubscription } from "@/lib/billing/entitySubscription.ts";
import { assertStableWriteAllowed } from "@/lib/billing/entityWriteGuard.ts";
import { getFavoriteIdSet } from "@/lib/services/favoriteService.ts";
import type { z } from "zod";
import type {
  createStableSchema,
  updateStableDiscoverySchema,
  updateStableProfileSchema,
} from "@/lib/validations/stable.ts";

export type CreateStableInput = z.infer<typeof createStableSchema>;
export type UpdateStableDiscoveryInput = z.infer<typeof updateStableDiscoverySchema>;
export type UpdateStableProfileInput = z.infer<typeof updateStableProfileSchema>;

// --- Role-aware view types ---

export type StableTab = "hub" | "profile" | "admin";

export type StableViewerRole =
  | "main_owner"
  | "co_owner"
  | "related"
  | "public"
  | "guest";

/** Role-scoped stable view DTO for the shared detail chrome. */
export type StableViewDto = {
  id: string;
  tradeName: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  websiteUrl?: string;
  imageUrl?: string;
  disciplines?: string[];
  services?: string[];
  facilities?: string[];
  address?: {
    city?: string;
    country?: string;
    state?: string;
    street?: string;
    postCode?: string;
    buildingNumber?: string;
  };
  isPublic?: boolean;
  acceptsNewHorses?: boolean;
  isMainOwner?: boolean;
  isCoOwner?: boolean;
  isAdmin?: boolean;
};

export type StableViewResponse = {
  viewerRole: StableViewerRole;
  allowedTabs: StableTab[];
  stable: StableViewDto;
};

// --- List types ---

export type StableListItem = {
  id: string;
  tradeName: string;
  city?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  disciplines?: string[];
  isPublic?: boolean;
  acceptsNewHorses?: boolean;
  updatedAt?: string;
};

export type StableListResult = {
  stables: StableListItem[];
  total: number;
  page: number;
  limit: number;
};

export type StableListFilters = {
  favorites?: boolean;
  page?: number;
  limit?: number;
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseStableRelationship(
  userId: string,
  stableId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "stable",
    receiverAccountType: "stable",
    receiverAccountId: stableId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function hasActiveStableCollaboration(
  userId: string,
  stableId: string,
): Promise<boolean> {
  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType: "stable",
    hostRoleProfileId: stableId,
    status: "active",
    active: true,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function createStable(actorUserId: string, input: CreateStableInput) {
  ensureObjectId(actorUserId, "user id");

  const defaultSubscription = buildDefaultEntitySubscription("EUR");

  const stable = await Stable.create({
    mainOwnerUserId: actorUserId,
    tradeName: input.tradeName,
    description: input.description,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    subscription: defaultSubscription,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.websiteUrl ? { websiteUrl: input.websiteUrl } : {}),
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.services ? { services: input.services } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewHorses !== undefined
      ? { acceptsNewHorses: input.acceptsNewHorses }
      : {}),
  });

  return stable.toObject();
}

export async function updateStableDiscovery(
  actorUserId: string,
  stableId: string,
  input: UpdateStableDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(stableId, "stable id");

  await assertStableWriteAllowed(stableId);

  const stable = await Stable.findOne({
    _id: stableId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!stable) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    stable.isPublic = input.isPublic;
  }

  if (input.acceptsNewHorses !== undefined) {
    stable.acceptsNewHorses = input.acceptsNewHorses;
  }

  await stable.save();
  return stable.toObject();
}

export async function updateStableProfile(
  actorUserId: string,
  stableId: string,
  input: UpdateStableProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(stableId, "stable id");

  await assertStableWriteAllowed(stableId);

  const stable = await Stable.findOne({
    _id: stableId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!stable) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
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

  const updated = await Stable.findByIdAndUpdate(stableId, updateOps, { new: true }).lean();
  if (!updated) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

export async function getStableForOwner(actorUserId: string, stableId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(stableId, "stable id");

  const stable = await Stable.findOne({
    _id: stableId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!stable) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }
  return stable as Record<string, unknown>;
}

// --- Role derivation ---

export const STABLE_ROLE_ORDER: StableViewerRole[] = [
  "guest",
  "public",
  "related",
  "co_owner",
  "main_owner",
];

export const STABLE_TAB_MIN_ROLE: Record<StableTab, StableViewerRole> = {
  hub: "guest",
  profile: "related",
  admin: "main_owner",
};

function deriveStableViewerRole(
  stable: Record<string, unknown>,
  userId?: string | null,
  hasRelatedAccess = false,
): StableViewerRole {
  if (!userId) return "guest";
  if (String(stable.mainOwnerUserId) === userId) return "main_owner";
  const isCoOwner = (Array.isArray(stable.coOwners) ? stable.coOwners : []).some(
    (c: { userId?: unknown }) => c.userId != null && String(c.userId) === userId,
  );
  if (isCoOwner) return "co_owner";
  if (hasRelatedAccess) return "related";
  return "public";
}

export function deriveStableAllowedTabs(viewerRole: StableViewerRole): StableTab[] {
  const roleIndex = STABLE_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(STABLE_TAB_MIN_ROLE) as StableTab[]).filter((tab) => {
    const minIndex = STABLE_ROLE_ORDER.indexOf(STABLE_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- List ---

function toStableListItem(doc: Record<string, unknown>): StableListItem {
  const address = (doc.address ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    tradeName: doc.tradeName as string,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    description: doc.description as string | undefined,
    imageUrl: doc.imageUrl as string | undefined,
    disciplines: doc.disciplines as string[] | undefined,
    isPublic: doc.isPublic as boolean | undefined,
    acceptsNewHorses: doc.acceptsNewHorses as boolean | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

/** List stables owned by the authenticated user ("my stables"). */
export async function listStablesForOwner(
  actorUserId: string,
  page = 1,
  limit = 20,
): Promise<StableListResult> {
  return listStables(actorUserId, { page, limit });
}

/** List stables for the authenticated user with optional favorites filter. */
export async function listStables(
  actorUserId: string,
  filters: StableListFilters = {},
): Promise<StableListResult> {
  ensureObjectId(actorUserId, "user id");
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  let query: Record<string, unknown>;

  if (filters.favorites) {
    const favoriteIds = await getFavoriteIdSet(actorUserId, "stable");
    if (favoriteIds.size === 0) {
      return { stables: [], total: 0, page, limit };
    }
    query = {
      _id: { $in: [...favoriteIds].map((id) => new mongoose.Types.ObjectId(id)) },
      isActive: { $ne: false },
    };
  } else {
    query = { ...ownedByUserQuery(actorUserId), isActive: { $ne: false } };
  }

  const [docs, total] = await Promise.all([
    Stable.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    Stable.countDocuments(query),
  ]);

  return {
    stables: (docs as unknown as Record<string, unknown>[]).map(toStableListItem),
    total,
    page,
    limit,
  };
}

function toStableView(stable: Record<string, unknown>): StableViewDto {
  const address = (stable.address ?? {}) as Record<string, unknown>;
  return {
    id: String(stable._id),
    tradeName: stable.tradeName as string,
    description: stable.description as string | undefined,
    email: stable.email as string | undefined,
    phoneNumber: stable.phoneNumber as string | undefined,
    websiteUrl: stable.websiteUrl as string | undefined,
    imageUrl: stable.imageUrl as string | undefined,
    disciplines: stable.disciplines as string[] | undefined,
    services: stable.services as string[] | undefined,
    facilities: stable.facilities as string[] | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    isPublic: stable.isPublic as boolean | undefined,
    acceptsNewHorses: stable.acceptsNewHorses as boolean | undefined,
  };
}

/**
 * Unified role-aware stable view — single endpoint for all stable tabs.
 * Returns the role-scoped stable, the viewer's role, and accessible tabs.
 */
export async function getStableView(
  stableId: string,
  userId?: string | null,
): Promise<StableViewResponse> {
  ensureObjectId(stableId, "stable id");

  const stable = await Stable.findById(stableId).lean();
  if (!stable) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(stable as Record<string, unknown>, "Stable");

  const stableDoc = stable as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, stableDoc);

  const hasRelationship = requesterUserId && !isOwner
    ? await hasAcceptedHorseStableRelationship(requesterUserId, stableId)
    : false;
  const hasCollaboration = requesterUserId && !isOwner
    ? await hasActiveStableCollaboration(requesterUserId, stableId)
    : false;

  if (!isOwner && stableDoc.isPublic === false && !hasRelationship && !hasCollaboration) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }

  const viewerRole = deriveStableViewerRole(
    stableDoc,
    userId,
    hasRelationship || hasCollaboration,
  );
  const allowedTabs = deriveStableAllowedTabs(viewerRole);

  const view = toStableView(stableDoc);
  if (isOwner && requesterUserId) {
    const isMainOwner = String(stableDoc.mainOwnerUserId) === requesterUserId;
    const isCoOwner = (Array.isArray(stableDoc.coOwners) ? stableDoc.coOwners : []).some(
      (c: { userId?: unknown }) => c.userId != null && String(c.userId) === requesterUserId,
    );
    view.isMainOwner = isMainOwner;
    view.isCoOwner = isCoOwner;
    view.isAdmin = isMainOwner || isCoOwner;
  }

  return { viewerRole, allowedTabs, stable: view };
}
