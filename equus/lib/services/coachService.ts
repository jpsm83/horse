/**
 * Coach service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/coaches` routes. Route handlers stay thin; user-linked
 * ownership and discovery rules live here.
 */

import mongoose from "mongoose";
import Coach from "@/models/Coach.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsCoachProfile } from "@/lib/coaches/userLinkedProfileAccess.ts";
import {
  canViewCoachDiscovery,
  type CoachDiscoveryRequesterContext,
} from "@/lib/coaches/coachDiscoveryAccess.ts";
import {
  buildPublicCoachCard,
  type PublicCoachCard,
} from "@/lib/coaches/buildPublicCoachCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createCoachSchema,
  updateCoachDiscoverySchema,
} from "@/lib/validations/coach.ts";

export type CreateCoachInput = z.infer<typeof createCoachSchema>;
export type UpdateCoachDiscoveryInput = z.infer<typeof updateCoachDiscoverySchema>;

export type { PublicCoachCard };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseCoachRelationship(
  userId: string,
  coachId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "coach",
    receiverAccountType: "coach",
    receiverAccountId: coachId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

export async function createCoach(actorUserId: string, input: CreateCoachInput) {
  ensureObjectId(actorUserId, "user id");

  const user = await User.findById(actorUserId).select("coachProfileId").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }
  if (user.coachProfileId) {
    throw new ApiError(409, "Coach profile already exists for this user", "CONFLICT");
  }

  const coach = await Coach.create({
    userId: actorUserId,
    displayName: input.displayName,
    bio: input.bio,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.competitionLevels ? { competitionLevels: input.competitionLevels } : {}),
    ...(input.preparationServices ? { preparationServices: input.preparationServices } : {}),
    ...(input.experienceYears !== undefined ? { experienceYears: input.experienceYears } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewClients !== undefined
      ? { acceptsNewClients: input.acceptsNewClients }
      : {}),
  });

  const linked = await User.findOneAndUpdate(
    { _id: actorUserId, coachProfileId: { $exists: false } },
    { coachProfileId: coach._id },
    { returnDocument: "after" },
  ).select("coachProfileId");

  if (!linked) {
    await Coach.findByIdAndDelete(coach._id);
    throw new ApiError(409, "Coach profile already exists for this user", "CONFLICT");
  }

  return coach.toObject();
}

export async function updateCoachDiscovery(
  actorUserId: string,
  coachId: string,
  input: UpdateCoachDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(coachId, "coach id");

  const coach = await Coach.findOne({ _id: coachId, userId: actorUserId });
  if (!coach) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    coach.isPublic = input.isPublic;
  }

  if (input.acceptsNewClients !== undefined) {
    coach.acceptsNewClients = input.acceptsNewClients;
  }

  await coach.save();
  return coach.toObject();
}

export async function getCoachForOwner(actorUserId: string, coachId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(coachId, "coach id");

  const coach = await Coach.findOne({ _id: coachId, userId: actorUserId }).lean();
  if (!coach) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }
  return coach as Record<string, unknown>;
}

export async function getPublicCoachCard(
  coachId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicCoachCard> {
  ensureObjectId(coachId, "coach id");

  const coach = await Coach.findById(coachId).lean();
  if (!coach) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(coach as Record<string, unknown>, "Coach");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId ? await hasAcceptedHorseCoachRelationship(requesterUserId, coachId) : false;

  const visibilityContext: CoachDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseCoachRelationship: hasRelationship,
  };

  if (!canViewCoachDiscovery(coach as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Coach not found", "NOT_FOUND");
  }

  return buildPublicCoachCard(coach as Record<string, unknown>);
}

export { userOwnsCoachProfile };
