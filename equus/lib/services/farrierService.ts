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
import type { z } from "zod";
import type {
  createFarrierSchema,
  updateFarrierDiscoverySchema,
} from "@/lib/validations/farrier.ts";

export type CreateFarrierInput = z.infer<typeof createFarrierSchema>;
export type UpdateFarrierDiscoveryInput = z.infer<typeof updateFarrierDiscoverySchema>;

export type { PublicFarrierCard };

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

export { userOwnsFarrierProfile };
