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
import {
  canViewGroomDiscovery,
  type GroomDiscoveryRequesterContext,
} from "@/lib/grooms/groomDiscoveryAccess.ts";
import {
  buildPublicGroomCard,
  type PublicGroomCard,
} from "@/lib/grooms/buildPublicGroomCard.ts";
import type { z } from "zod";
import type {
  createGroomSchema,
  updateGroomDiscoverySchema,
} from "@/lib/validations/groom.ts";

export type CreateGroomInput = z.infer<typeof createGroomSchema>;
export type UpdateGroomDiscoveryInput = z.infer<typeof updateGroomDiscoverySchema>;

export type { PublicGroomCard };

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

export async function getPublicGroomCard(
  groomId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicGroomCard> {
  ensureObjectId(groomId, "groom id");

  const groom = await Groom.findById(groomId).lean();
  if (!groom) {
    throw new ApiError(404, "Groom not found", "NOT_FOUND");
  }

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId ? await hasAcceptedHorseGroomRelationship(requesterUserId, groomId) : false;

  const visibilityContext: GroomDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseGroomRelationship: hasRelationship,
  };

  if (!canViewGroomDiscovery(groom as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Groom not found", "NOT_FOUND");
  }

  return buildPublicGroomCard(groom as Record<string, unknown>);
}

export { userOwnsGroomProfile };
