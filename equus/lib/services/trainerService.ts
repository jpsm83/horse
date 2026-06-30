/**
 * Trainer service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/trainers` routes. Route handlers stay thin; user-linked
 * ownership and discovery rules live here.
 */

import mongoose from "mongoose";
import Trainer from "@/models/Trainer.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsTrainerProfile } from "@/lib/trainers/userLinkedProfileAccess.ts";
import {
  canViewTrainerDiscovery,
  type TrainerDiscoveryRequesterContext,
} from "@/lib/trainers/trainerDiscoveryAccess.ts";
import {
  buildPublicTrainerCard,
  type PublicTrainerCard,
} from "@/lib/trainers/buildPublicTrainerCard.ts";
import type { z } from "zod";
import type {
  createTrainerSchema,
  updateTrainerDiscoverySchema,
} from "@/lib/validations/trainer.ts";

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;
export type UpdateTrainerDiscoveryInput = z.infer<typeof updateTrainerDiscoverySchema>;

export type { PublicTrainerCard };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseTrainerRelationship(
  userId: string,
  trainerId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "trainer",
    receiverAccountType: "trainer",
    receiverAccountId: trainerId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

export async function createTrainer(actorUserId: string, input: CreateTrainerInput) {
  ensureObjectId(actorUserId, "user id");

  const user = await User.findById(actorUserId).select("trainerProfileId").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }
  if (user.trainerProfileId) {
    throw new ApiError(409, "Trainer profile already exists for this user", "CONFLICT");
  }

  const trainer = await Trainer.create({
    userId: actorUserId,
    displayName: input.displayName,
    bio: input.bio,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.specialties ? { specialties: input.specialties } : {}),
    ...(input.experienceYears !== undefined ? { experienceYears: input.experienceYears } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewClients !== undefined
      ? { acceptsNewClients: input.acceptsNewClients }
      : {}),
  });

  const linked = await User.findOneAndUpdate(
    { _id: actorUserId, trainerProfileId: { $exists: false } },
    { trainerProfileId: trainer._id },
    { returnDocument: "after" },
  ).select("trainerProfileId");

  if (!linked) {
    await Trainer.findByIdAndDelete(trainer._id);
    throw new ApiError(409, "Trainer profile already exists for this user", "CONFLICT");
  }

  return trainer.toObject();
}

export async function updateTrainerDiscovery(
  actorUserId: string,
  trainerId: string,
  input: UpdateTrainerDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(trainerId, "trainer id");

  const trainer = await Trainer.findOne({ _id: trainerId, userId: actorUserId });
  if (!trainer) {
    throw new ApiError(404, "Trainer not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    trainer.isPublic = input.isPublic;
  }

  if (input.acceptsNewClients !== undefined) {
    trainer.acceptsNewClients = input.acceptsNewClients;
  }

  await trainer.save();
  return trainer.toObject();
}

export async function getTrainerForOwner(actorUserId: string, trainerId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(trainerId, "trainer id");

  const trainer = await Trainer.findOne({ _id: trainerId, userId: actorUserId }).lean();
  if (!trainer) {
    throw new ApiError(404, "Trainer not found", "NOT_FOUND");
  }
  return trainer as Record<string, unknown>;
}

export async function getPublicTrainerCard(
  trainerId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicTrainerCard> {
  ensureObjectId(trainerId, "trainer id");

  const trainer = await Trainer.findById(trainerId).lean();
  if (!trainer) {
    throw new ApiError(404, "Trainer not found", "NOT_FOUND");
  }

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId
      ? await hasAcceptedHorseTrainerRelationship(requesterUserId, trainerId)
      : false;

  const visibilityContext: TrainerDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseTrainerRelationship: hasRelationship,
  };

  if (!canViewTrainerDiscovery(trainer as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Trainer not found", "NOT_FOUND");
  }

  return buildPublicTrainerCard(trainer as Record<string, unknown>);
}

export { userOwnsTrainerProfile };
