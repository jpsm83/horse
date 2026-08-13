/**
 * Rider service — creation, discovery/public-read flows, role-aware view, and
 * profile update.
 *
 * Called by `/api/v1/riders` routes. Route handlers stay thin; user-linked
 * ownership (`Rider.userId`) and discovery rules live here.
 */

import mongoose from "mongoose";
import Rider from "@/models/Rider.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsRiderProfile } from "@/lib/riders/userLinkedProfileAccess.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createRiderSchema,
  updateRiderDiscoverySchema,
  updateRiderProfileSchema,
} from "@/lib/validations/rider.ts";

export type CreateRiderInput = z.infer<typeof createRiderSchema>;
export type UpdateRiderDiscoveryInput = z.infer<typeof updateRiderDiscoverySchema>;
export type UpdateRiderProfileInput = z.infer<typeof updateRiderProfileSchema>;

// --- Role-aware view types ---

export type RiderTab = "hub" | "profile";

export type RiderViewerRole = "owner" | "related" | "public" | "guest";

/** Role-scoped rider view DTO for the shared detail chrome. */
export type RiderViewDto = {
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
  disciplines?: string[];
  experienceYears?: number;
  competitionHighlights?: string[];
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  isOwner?: boolean;
};

export type RiderViewResponse = {
  viewerRole: RiderViewerRole;
  allowedTabs: RiderTab[];
  rider: RiderViewDto;
};

// --- List types ---

export type RiderListItem = {
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

export type RiderListResult = {
  riders: RiderListItem[];
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseRiderRelationship(
  userId: string,
  riderId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "rider",
    receiverAccountType: "rider",
    receiverAccountId: riderId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

export async function createRider(actorUserId: string, input: CreateRiderInput) {
  ensureObjectId(actorUserId, "user id");

  const user = await User.findById(actorUserId).select("riderProfileId").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }
  if (user.riderProfileId) {
    throw new ApiError(409, "Rider profile already exists for this user", "CONFLICT");
  }

  const rider = await Rider.create({
    userId: actorUserId,
    displayName: input.displayName,
    email: input.email,
    ...(input.bio ? { bio: input.bio } : {}),
    ...(input.phoneNumber ? { phoneNumber: input.phoneNumber } : {}),
    ...(input.address ? { address: input.address } : {}),
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.experienceYears !== undefined ? { experienceYears: input.experienceYears } : {}),
    ...(input.competitionHighlights ? { competitionHighlights: input.competitionHighlights } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewClients !== undefined
      ? { acceptsNewClients: input.acceptsNewClients }
      : {}),
  });

  const linked = await User.findOneAndUpdate(
    { _id: actorUserId, riderProfileId: { $exists: false } },
    { riderProfileId: rider._id },
    { returnDocument: "after" },
  ).select("riderProfileId");

  if (!linked) {
    await Rider.findByIdAndDelete(rider._id);
    throw new ApiError(409, "Rider profile already exists for this user", "CONFLICT");
  }

  return rider.toObject();
}

export async function updateRiderDiscovery(
  actorUserId: string,
  riderId: string,
  input: UpdateRiderDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(riderId, "rider id");

  const rider = await Rider.findOne({ _id: riderId, userId: actorUserId });
  if (!rider) {
    throw new ApiError(404, "Rider not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    rider.isPublic = input.isPublic;
  }

  if (input.acceptsNewClients !== undefined) {
    rider.acceptsNewClients = input.acceptsNewClients;
  }

  await rider.save();
  return rider.toObject();
}

export async function getRiderForOwner(actorUserId: string, riderId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(riderId, "rider id");

  const rider = await Rider.findOne({ _id: riderId, userId: actorUserId }).lean();
  if (!rider) {
    throw new ApiError(404, "Rider not found", "NOT_FOUND");
  }
  return rider as Record<string, unknown>;
}

// --- Role derivation ---

export const RIDER_ROLE_ORDER: RiderViewerRole[] = [
  "guest",
  "public",
  "related",
  "owner",
];

export const RIDER_TAB_MIN_ROLE: Record<RiderTab, RiderViewerRole> = {
  hub: "guest",
  profile: "owner",
};

function deriveRiderViewerRole(
  rider: Record<string, unknown>,
  userId?: string | null,
  hasRelationship = false,
): RiderViewerRole {
  if (!userId) return "guest";
  if (userOwnsRiderProfile(userId, rider)) return "owner";
  if (hasRelationship) return "related";
  return "public";
}

export function deriveRiderAllowedTabs(viewerRole: RiderViewerRole): RiderTab[] {
  const roleIndex = RIDER_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(RIDER_TAB_MIN_ROLE) as RiderTab[]).filter((tab) => {
    const minIndex = RIDER_ROLE_ORDER.indexOf(RIDER_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- List ---

function toRiderListItem(doc: Record<string, unknown>): RiderListItem {
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

/** List the rider profile owned by the authenticated user (max one). */
export async function listRidersForOwner(actorUserId: string): Promise<RiderListResult> {
  ensureObjectId(actorUserId, "user id");
  const query = { userId: actorUserId, isActive: { $ne: false } };
  const docs = await Rider.find(query).sort({ updatedAt: -1 }).lean();
  return {
    riders: (docs as unknown as Record<string, unknown>[]).map(toRiderListItem),
  };
}

// --- View ---

function toRiderView(rider: Record<string, unknown>): RiderViewDto {
  const address = (rider.address ?? {}) as Record<string, unknown>;
  return {
    id: String(rider._id),
    displayName: rider.displayName as string,
    bio: rider.bio as string | undefined,
    email: rider.email as string | undefined,
    phoneNumber: rider.phoneNumber as string | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    disciplines: rider.disciplines as string[] | undefined,
    experienceYears: rider.experienceYears as number | undefined,
    competitionHighlights: rider.competitionHighlights as string[] | undefined,
    isPublic: rider.isPublic as boolean | undefined,
    acceptsNewClients: rider.acceptsNewClients as boolean | undefined,
  };
}

/**
 * Unified role-aware rider view — single endpoint for all rider tabs.
 * Returns the role-scoped rider, the viewer's role, and accessible tabs.
 * `isOwner` is set when `rider.userId === userId`.
 */
export async function getRiderView(
  riderId: string,
  userId?: string | null,
): Promise<RiderViewResponse> {
  ensureObjectId(riderId, "rider id");

  const rider = await Rider.findById(riderId).lean();
  if (!rider) {
    throw new ApiError(404, "Rider not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(rider as Record<string, unknown>, "Rider");

  const riderDoc = rider as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsRiderProfile(requesterUserId, riderDoc);

  const hasRelationship = requesterUserId
    ? await hasAcceptedHorseRiderRelationship(requesterUserId, riderId)
    : false;

  if (!isOwner && riderDoc.isPublic === false && !hasRelationship) {
    throw new ApiError(404, "Rider not found", "NOT_FOUND");
  }

  const viewerRole = deriveRiderViewerRole(riderDoc, userId, hasRelationship);
  const allowedTabs = deriveRiderAllowedTabs(viewerRole);

  const view = toRiderView(riderDoc);
  if (isOwner) {
    view.isOwner = true;
  }

  return { viewerRole, allowedTabs, rider: view };
}

/**
 * Owner profile update — dirty-field PATCH built from the validated input.
 * Empty strings become `$unset` (optional clears); address is flattened onto
 * `address.*` keys so partial address edits never wipe other subfields.
 * Requires `rider.userId === actorUserId`.
 */
export async function updateRiderProfile(
  actorUserId: string,
  riderId: string,
  input: UpdateRiderProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(riderId, "rider id");

  const rider = await Rider.findOne({ _id: riderId, userId: actorUserId });
  if (!rider) {
    throw new ApiError(404, "Rider not found", "NOT_FOUND");
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

  const updated = await Rider.findByIdAndUpdate(riderId, updateOps, { new: true }).lean();
  if (!updated) {
    throw new ApiError(404, "Rider not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

export { userOwnsRiderProfile };
