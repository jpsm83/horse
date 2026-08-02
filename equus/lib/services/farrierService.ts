/**
 * Farrier service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/farriers` routes. Route handlers stay thin; user-linked
 * ownership and discovery rules live here.
 */

import mongoose from "mongoose";
import Farrier from "@/models/Farrier.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsFarrierProfile } from "@/lib/farriers/userLinkedProfileAccess.ts";
import {
  canViewFarrierDiscovery,
  type FarrierDiscoveryRequesterContext,
} from "@/lib/farriers/farrierDiscoveryAccess.ts";
import {
  buildPublicFarrierCard,
  type PublicFarrierCard,
} from "@/lib/farriers/buildPublicFarrierCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createFarrierSchema,
  updateFarrierDiscoverySchema,
  updateFarrierProfileSchema,
} from "@/lib/validations/farrier.ts";

export type CreateFarrierInput = z.infer<typeof createFarrierSchema>;
export type UpdateFarrierDiscoveryInput = z.infer<typeof updateFarrierDiscoverySchema>;
export type UpdateFarrierProfileInput = z.infer<typeof updateFarrierProfileSchema>;

export type { PublicFarrierCard };

// --- Role-aware view types ---

export type FarrierTab = "hub" | "profile";

export type FarrierViewerRole = "owner" | "public" | "guest";

/** Role-scoped farrier view DTO for the shared detail chrome. */
export type FarrierViewDto = {
  id: string;
  displayName: string;
  bio?: string;
  email?: string;
  phoneNumber?: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
    street?: string;
    postCode?: string;
    buildingNumber?: string;
  };
  imageUrl?: string;
  experienceYears?: number;
  serviceAreaKm?: number;
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  isOwner?: boolean;
};

export type FarrierViewResponse = {
  viewerRole: FarrierViewerRole;
  allowedTabs: FarrierTab[];
  farrier: FarrierViewDto;
};

// --- List types ---

export type FarrierListItem = {
  id: string;
  displayName: string;
  city?: string;
  country?: string;
  bio?: string;
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  updatedAt?: string;
};

export type FarrierListResult = {
  farriers: FarrierListItem[];
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseFarrierRelationship(
  userId: string,
  farrierId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "farrier",
    receiverAccountType: "farrier",
    receiverAccountId: farrierId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

export async function createFarrier(actorUserId: string, input: CreateFarrierInput) {
  ensureObjectId(actorUserId, "user id");

  const user = await User.findById(actorUserId).select("farrierProfileId").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }
  if (user.farrierProfileId) {
    throw new ApiError(409, "Farrier profile already exists for this user", "CONFLICT");
  }

  const farrier = await Farrier.create({
    userId: actorUserId,
    displayName: input.displayName,
    email: input.email,
    ...(input.bio ? { bio: input.bio } : {}),
    ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
    ...(input.address ? { address: input.address } : {}),
    ...(input.experienceYears !== undefined ? { experienceYears: input.experienceYears } : {}),
    ...(input.serviceAreaKm !== undefined ? { serviceAreaKm: input.serviceAreaKm } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewClients !== undefined
      ? { acceptsNewClients: input.acceptsNewClients }
      : {}),
  });

  const linked = await User.findOneAndUpdate(
    { _id: actorUserId, farrierProfileId: { $exists: false } },
    { farrierProfileId: farrier._id },
    { returnDocument: "after" },
  ).select("farrierProfileId");

  if (!linked) {
    await Farrier.findByIdAndDelete(farrier._id);
    throw new ApiError(409, "Farrier profile already exists for this user", "CONFLICT");
  }

  return farrier.toObject();
}

export async function updateFarrierDiscovery(
  actorUserId: string,
  farrierId: string,
  input: UpdateFarrierDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(farrierId, "farrier id");

  const farrier = await Farrier.findOne({ _id: farrierId, userId: actorUserId });
  if (!farrier) {
    throw new ApiError(404, "Farrier not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    farrier.isPublic = input.isPublic;
  }

  if (input.acceptsNewClients !== undefined) {
    farrier.acceptsNewClients = input.acceptsNewClients;
  }

  await farrier.save();
  return farrier.toObject();
}

export async function getFarrierForOwner(actorUserId: string, farrierId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(farrierId, "farrier id");

  const farrier = await Farrier.findOne({ _id: farrierId, userId: actorUserId }).lean();
  if (!farrier) {
    throw new ApiError(404, "Farrier not found", "NOT_FOUND");
  }
  return farrier as Record<string, unknown>;
}

export async function getPublicFarrierCard(
  farrierId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicFarrierCard> {
  ensureObjectId(farrierId, "farrier id");

  const farrier = await Farrier.findById(farrierId).lean();
  if (!farrier) {
    throw new ApiError(404, "Farrier not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(farrier as Record<string, unknown>, "Farrier");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId
      ? await hasAcceptedHorseFarrierRelationship(requesterUserId, farrierId)
      : false;

  const visibilityContext: FarrierDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseFarrierRelationship: hasRelationship,
  };

  if (!canViewFarrierDiscovery(farrier as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Farrier not found", "NOT_FOUND");
  }

  return buildPublicFarrierCard(farrier as Record<string, unknown>);
}

// --- Role derivation ---

export const FARRIER_ROLE_ORDER: FarrierViewerRole[] = ["guest", "public", "owner"];

export const FARRIER_TAB_MIN_ROLE: Record<FarrierTab, FarrierViewerRole> = {
  hub: "guest",
  profile: "owner",
};

export function deriveFarrierViewerRole(
  farrier: Record<string, unknown>,
  userId?: string | null,
): FarrierViewerRole {
  if (!userId) return "guest";
  if (String(farrier.userId) === userId) return "owner";
  return "public";
}

export function deriveFarrierAllowedTabs(viewerRole: FarrierViewerRole): FarrierTab[] {
  const roleIndex = FARRIER_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(FARRIER_TAB_MIN_ROLE) as FarrierTab[]).filter((tab) => {
    const minIndex = FARRIER_ROLE_ORDER.indexOf(FARRIER_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- Profile update ---

/**
 * Update a farrier profile for its owner. Only dirty fields are sent; optional
 * fields cleared to `""` are `$unset` in MongoDB (profile.md pattern).
 */
export async function updateFarrierProfile(
  actorUserId: string,
  farrierId: string,
  input: UpdateFarrierProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(farrierId, "farrier id");

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

  const updated = await Farrier.findOneAndUpdate(
    { _id: farrierId, userId: actorUserId },
    updateOps,
    { new: true },
  ).lean();
  if (!updated) {
    throw new ApiError(404, "Farrier not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

// --- List ---

function toFarrierListItem(doc: Record<string, unknown>): FarrierListItem {
  const address = (doc.address ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    displayName: doc.displayName as string,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    bio: doc.bio as string | undefined,
    isPublic: doc.isPublic as boolean | undefined,
    acceptsNewClients: doc.acceptsNewClients as boolean | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

/** List farrier profiles owned by the authenticated user ("my farrier"). */
export async function listFarriersForOwner(
  actorUserId: string,
): Promise<FarrierListResult> {
  ensureObjectId(actorUserId, "user id");

  const docs = await Farrier.find({ userId: actorUserId, isActive: { $ne: false } })
    .sort({ updatedAt: -1 })
    .lean();

  return {
    farriers: (docs as unknown as Record<string, unknown>[]).map(toFarrierListItem),
  };
}

// --- View ---

function toFarrierView(farrier: Record<string, unknown>): FarrierViewDto {
  const address = (farrier.address ?? {}) as Record<string, unknown>;
  return {
    id: String(farrier._id),
    displayName: farrier.displayName as string,
    bio: farrier.bio as string | undefined,
    email: farrier.email as string | undefined,
    phoneNumber: farrier.phoneNumber as string | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    imageUrl: farrier.imageUrl as string | undefined,
    experienceYears: farrier.experienceYears as number | undefined,
    serviceAreaKm: farrier.serviceAreaKm as number | undefined,
    isPublic: farrier.isPublic as boolean | undefined,
    acceptsNewClients: farrier.acceptsNewClients as boolean | undefined,
  };
}

/**
 * Unified role-aware farrier view — single endpoint for all farrier tabs.
 * Returns the role-scoped farrier, the viewer's role, and accessible tabs.
 * `isOwner` is `true` only when the requester is the linked `farrier.userId`.
 */
export async function getFarrierView(
  farrierId: string,
  userId?: string | null,
): Promise<FarrierViewResponse> {
  ensureObjectId(farrierId, "farrier id");

  const farrier = await Farrier.findById(farrierId).lean();
  if (!farrier) {
    throw new ApiError(404, "Farrier not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(farrier as Record<string, unknown>, "Farrier");

  const farrierDoc = farrier as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsFarrierProfile(requesterUserId, farrierDoc);

  if (!isOwner && farrierDoc.isPublic === false) {
    const hasRelationship = requesterUserId
      ? await hasAcceptedHorseFarrierRelationship(requesterUserId, farrierId)
      : false;
    if (!hasRelationship) {
      throw new ApiError(404, "Farrier not found", "NOT_FOUND");
    }
  }

  const viewerRole = deriveFarrierViewerRole(farrierDoc, userId);
  const allowedTabs = deriveFarrierAllowedTabs(viewerRole);

  const view = toFarrierView(farrierDoc);
  view.isOwner = isOwner;

  return { viewerRole, allowedTabs, farrier: view };
}

export { userOwnsFarrierProfile };
