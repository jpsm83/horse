/**
 * Riding club service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/riding-clubs` routes. Route handlers stay thin; ownership and
 * discovery rules live here.
 */

import mongoose from "mongoose";
import RidingClub from "@/models/RidingClub.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import {
  canViewRidingClubDiscovery,
  type RidingClubDiscoveryRequesterContext,
} from "@/lib/ridingClubs/ridingClubDiscoveryAccess.ts";
import {
  buildPublicRidingClubCard,
  type PublicRidingClubCard,
} from "@/lib/ridingClubs/buildPublicRidingClubCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createRidingClubSchema,
  updateRidingClubDiscoverySchema,
} from "@/lib/validations/ridingClub.ts";

export type CreateRidingClubInput = z.infer<typeof createRidingClubSchema>;
export type UpdateRidingClubDiscoveryInput = z.infer<typeof updateRidingClubDiscoverySchema>;

export type { PublicRidingClubCard };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseRidingClubRelationship(
  userId: string,
  ridingClubId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "ridingClub",
    receiverAccountType: "ridingClub",
    receiverAccountId: ridingClubId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function hasActiveRidingClubCollaboration(
  userId: string,
  ridingClubId: string,
): Promise<boolean> {
  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType: "ridingClub",
    hostRoleProfileId: ridingClubId,
    status: "active",
    active: true,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function createRidingClub(actorUserId: string, input: CreateRidingClubInput) {
  ensureObjectId(actorUserId, "user id");

  const ridingClub = await RidingClub.create({
    mainOwnerUserId: actorUserId,
    clubName: input.clubName,
    description: input.description,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.facilities ? { facilities: input.facilities } : {}),
    ...(input.membershipInfo ? { membershipInfo: input.membershipInfo } : {}),
    ...(input.membershipFee !== undefined ? { membershipFee: input.membershipFee } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewMembers !== undefined
      ? { acceptsNewMembers: input.acceptsNewMembers }
      : {}),
  });

  return ridingClub.toObject();
}

export async function updateRidingClubDiscovery(
  actorUserId: string,
  ridingClubId: string,
  input: UpdateRidingClubDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(ridingClubId, "riding club id");

  const ridingClub = await RidingClub.findOne({
    _id: ridingClubId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!ridingClub) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    ridingClub.isPublic = input.isPublic;
  }

  if (input.acceptsNewMembers !== undefined) {
    ridingClub.acceptsNewMembers = input.acceptsNewMembers;
  }

  await ridingClub.save();
  return ridingClub.toObject();
}

export async function getRidingClubForOwner(actorUserId: string, ridingClubId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(ridingClubId, "riding club id");

  const ridingClub = await RidingClub.findOne({
    _id: ridingClubId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!ridingClub) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }
  return ridingClub as Record<string, unknown>;
}

export async function getPublicRidingClubCard(
  ridingClubId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicRidingClubCard> {
  ensureObjectId(ridingClubId, "riding club id");

  const ridingClub = await RidingClub.findById(ridingClubId).lean();
  if (!ridingClub) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(ridingClub as Record<string, unknown>, "Riding club");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId
      ? await hasAcceptedHorseRidingClubRelationship(requesterUserId, ridingClubId)
      : false;
  const hasCollaboration =
    requesterUserId
      ? await hasActiveRidingClubCollaboration(requesterUserId, ridingClubId)
      : false;

  const visibilityContext: RidingClubDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseRidingClubRelationship: hasRelationship,
    hasActiveCollaboration: hasCollaboration,
  };

  if (!canViewRidingClubDiscovery(ridingClub as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Riding club not found", "NOT_FOUND");
  }

  return buildPublicRidingClubCard(ridingClub as Record<string, unknown>);
}
