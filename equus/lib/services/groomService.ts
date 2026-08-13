/**
 * Groom service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/grooms` routes. Route handlers stay thin; user-linked
 * ownership and discovery rules live here.
 */

import mongoose from "mongoose";
import Groom from "@/models/Groom.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsGroomProfile } from "@/lib/grooms/userLinkedProfileAccess.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createGroomSchema,
  updateGroomDiscoverySchema,
  updateGroomProfileSchema,
} from "@/lib/validations/groom.ts";

export type CreateGroomInput = z.infer<typeof createGroomSchema>;
export type UpdateGroomDiscoveryInput = z.infer<typeof updateGroomDiscoverySchema>;
export type UpdateGroomProfileInput = z.infer<typeof updateGroomProfileSchema>;

// --- Role-aware view types ---

export type GroomTab = "hub" | "profile";

export type GroomViewerRole = "owner" | "public" | "guest";

/** Role-scoped groom view DTO for the shared detail chrome. */
export type GroomViewDto = {
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
  specialties?: string[];
  experienceYears?: number;
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  isOwner?: boolean;
};

export type GroomViewResponse = {
  viewerRole: GroomViewerRole;
  allowedTabs: GroomTab[];
  groom: GroomViewDto;
};

// --- List types ---

export type GroomListItem = {
  id: string;
  displayName: string;
  city?: string;
  country?: string;
  bio?: string;
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  updatedAt?: string;
};

export type GroomListResult = {
  grooms: GroomListItem[];
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseGroomRelationship(
  userId: string,
  groomId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "groom",
    receiverAccountType: "groom",
    receiverAccountId: groomId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

export async function createGroom(actorUserId: string, input: CreateGroomInput) {
  ensureObjectId(actorUserId, "user id");

  const user = await User.findById(actorUserId).select("groomProfileId").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }
  if (user.groomProfileId) {
    throw new ApiError(409, "Groom profile already exists for this user", "CONFLICT");
  }

  const groom = await Groom.create({
    userId: actorUserId,
    displayName: input.displayName,
    email: input.email,
    ...(input.bio ? { bio: input.bio } : {}),
    ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
    ...(input.address ? { address: input.address } : {}),
    ...(input.specialties ? { specialties: input.specialties } : {}),
    ...(input.experienceYears !== undefined ? { experienceYears: input.experienceYears } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewClients !== undefined
      ? { acceptsNewClients: input.acceptsNewClients }
      : {}),
  });

  const linked = await User.findOneAndUpdate(
    { _id: actorUserId, groomProfileId: { $exists: false } },
    { groomProfileId: groom._id },
    { returnDocument: "after" },
  ).select("groomProfileId");

  if (!linked) {
    await Groom.findByIdAndDelete(groom._id);
    throw new ApiError(409, "Groom profile already exists for this user", "CONFLICT");
  }

  return groom.toObject();
}

export async function updateGroomDiscovery(
  actorUserId: string,
  groomId: string,
  input: UpdateGroomDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(groomId, "groom id");

  const groom = await Groom.findOne({ _id: groomId, userId: actorUserId });
  if (!groom) {
    throw new ApiError(404, "Groom not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    groom.isPublic = input.isPublic;
  }

  if (input.acceptsNewClients !== undefined) {
    groom.acceptsNewClients = input.acceptsNewClients;
  }

  await groom.save();
  return groom.toObject();
}

export async function getGroomForOwner(actorUserId: string, groomId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(groomId, "groom id");

  const groom = await Groom.findOne({ _id: groomId, userId: actorUserId }).lean();
  if (!groom) {
    throw new ApiError(404, "Groom not found", "NOT_FOUND");
  }
  return groom as Record<string, unknown>;
}

// --- Role derivation ---

export const GROOM_ROLE_ORDER: GroomViewerRole[] = ["guest", "public", "owner"];

export const GROOM_TAB_MIN_ROLE: Record<GroomTab, GroomViewerRole> = {
  hub: "guest",
  profile: "owner",
};

export function deriveGroomViewerRole(
  groom: Record<string, unknown>,
  userId?: string | null,
): GroomViewerRole {
  if (!userId) return "guest";
  if (String(groom.userId) === userId) return "owner";
  return "public";
}

export function deriveGroomAllowedTabs(viewerRole: GroomViewerRole): GroomTab[] {
  const roleIndex = GROOM_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(GROOM_TAB_MIN_ROLE) as GroomTab[]).filter((tab) => {
    const minIndex = GROOM_ROLE_ORDER.indexOf(GROOM_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- Profile update ---

/**
 * Update a groom profile for its owner. Only dirty fields are sent; optional
 * fields cleared to `""` are `$unset` in MongoDB (profile.md pattern).
 */
export async function updateGroomProfile(
  actorUserId: string,
  groomId: string,
  input: UpdateGroomProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(groomId, "groom id");

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

  const updated = await Groom.findOneAndUpdate(
    { _id: groomId, userId: actorUserId },
    updateOps,
    { new: true },
  ).lean();
  if (!updated) {
    throw new ApiError(404, "Groom not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

// --- List ---

function toGroomListItem(doc: Record<string, unknown>): GroomListItem {
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

/** List groom profiles owned by the authenticated user ("my groom"). */
export async function listGroomsForOwner(
  actorUserId: string,
): Promise<GroomListResult> {
  ensureObjectId(actorUserId, "user id");

  const docs = await Groom.find({ userId: actorUserId, isActive: { $ne: false } })
    .sort({ updatedAt: -1 })
    .lean();

  return {
    grooms: (docs as unknown as Record<string, unknown>[]).map(toGroomListItem),
  };
}

// --- View ---

function toGroomView(groom: Record<string, unknown>): GroomViewDto {
  const address = (groom.address ?? {}) as Record<string, unknown>;
  return {
    id: String(groom._id),
    displayName: groom.displayName as string,
    bio: groom.bio as string | undefined,
    email: groom.email as string | undefined,
    phoneNumber: groom.phoneNumber as string | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    imageUrl: groom.imageUrl as string | undefined,
    specialties: groom.specialties as string[] | undefined,
    experienceYears: groom.experienceYears as number | undefined,
    isPublic: groom.isPublic as boolean | undefined,
    acceptsNewClients: groom.acceptsNewClients as boolean | undefined,
  };
}

/**
 * Unified role-aware groom view — single endpoint for all groom tabs.
 * Returns the role-scoped groom, the viewer's role, and accessible tabs.
 * `isOwner` is `true` only when the requester is the linked `groom.userId`.
 */
export async function getGroomView(
  groomId: string,
  userId?: string | null,
): Promise<GroomViewResponse> {
  ensureObjectId(groomId, "groom id");

  const groom = await Groom.findById(groomId).lean();
  if (!groom) {
    throw new ApiError(404, "Groom not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(groom as Record<string, unknown>, "Groom");

  const groomDoc = groom as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsGroomProfile(requesterUserId, groomDoc);

  if (!isOwner && groomDoc.isPublic === false) {
    const hasRelationship = requesterUserId
      ? await hasAcceptedHorseGroomRelationship(requesterUserId, groomId)
      : false;
    if (!hasRelationship) {
      throw new ApiError(404, "Groom not found", "NOT_FOUND");
    }
  }

  const viewerRole = deriveGroomViewerRole(groomDoc, userId);
  const allowedTabs = deriveGroomAllowedTabs(viewerRole);

  const view = toGroomView(groomDoc);
  view.isOwner = isOwner;

  return { viewerRole, allowedTabs, groom: view };
}

export { userOwnsGroomProfile };
