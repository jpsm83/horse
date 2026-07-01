/**
 * Rider service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/riders` routes. Route handlers stay thin; user-linked
 * ownership and discovery rules live here.
 */

import mongoose from "mongoose";
import Rider from "@/models/Rider.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsRiderProfile } from "@/lib/riders/userLinkedProfileAccess.ts";
import {
  canViewRiderDiscovery,
  type RiderDiscoveryRequesterContext,
} from "@/lib/riders/riderDiscoveryAccess.ts";
import {
  buildPublicRiderCard,
  type PublicRiderCard,
} from "@/lib/riders/buildPublicRiderCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createRiderSchema,
  updateRiderDiscoverySchema,
} from "@/lib/validations/rider.ts";

export type CreateRiderInput = z.infer<typeof createRiderSchema>;
export type UpdateRiderDiscoveryInput = z.infer<typeof updateRiderDiscoverySchema>;

export type { PublicRiderCard };

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

export async function getPublicRiderCard(
  riderId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicRiderCard> {
  ensureObjectId(riderId, "rider id");

  const rider = await Rider.findById(riderId).lean();
  if (!rider) {
    throw new ApiError(404, "Rider not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(rider as Record<string, unknown>, "Rider");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId ? await hasAcceptedHorseRiderRelationship(requesterUserId, riderId) : false;

  const visibilityContext: RiderDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseRiderRelationship: hasRelationship,
  };

  if (!canViewRiderDiscovery(rider as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Rider not found", "NOT_FOUND");
  }

  return buildPublicRiderCard(rider as Record<string, unknown>);
}

export { userOwnsRiderProfile };
