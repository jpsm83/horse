/**
 * Breeder service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/breeders` routes. Route handlers stay thin; ownership and
 * discovery rules live here.
 */

import mongoose from "mongoose";
import Breeder from "@/models/Breeder.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import {
  canViewBreederDiscovery,
  type BreederDiscoveryRequesterContext,
} from "@/lib/breeders/breederDiscoveryAccess.ts";
import {
  buildPublicBreederCard,
  type PublicBreederCard,
} from "@/lib/breeders/buildPublicBreederCard.ts";
import type { z } from "zod";
import type {
  createBreederSchema,
  updateBreederDiscoverySchema,
} from "@/lib/validations/breeder.ts";

export type CreateBreederInput = z.infer<typeof createBreederSchema>;
export type UpdateBreederDiscoveryInput = z.infer<typeof updateBreederDiscoverySchema>;

export type { PublicBreederCard };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseBreederRelationship(
  userId: string,
  breederId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "breeder",
    receiverAccountType: "breeder",
    receiverAccountId: breederId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function hasActiveBreederCollaboration(
  userId: string,
  breederId: string,
): Promise<boolean> {
  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType: "breeder",
    hostRoleProfileId: breederId,
    status: "active",
    active: true,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function createBreeder(actorUserId: string, input: CreateBreederInput) {
  ensureObjectId(actorUserId, "user id");

  const breeder = await Breeder.create({
    mainOwnerUserId: actorUserId,
    operationName: input.operationName,
    description: input.description,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.bloodlines ? { bloodlines: input.bloodlines } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
  });

  return breeder.toObject();
}

export async function updateBreederDiscovery(
  actorUserId: string,
  breederId: string,
  input: UpdateBreederDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(breederId, "breeder id");

  const breeder = await Breeder.findOne({
    _id: breederId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!breeder) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    breeder.isPublic = input.isPublic;
  }

  await breeder.save();
  return breeder.toObject();
}

export async function getBreederForOwner(actorUserId: string, breederId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(breederId, "breeder id");

  const breeder = await Breeder.findOne({
    _id: breederId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!breeder) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }
  return breeder as Record<string, unknown>;
}

export async function getPublicBreederCard(
  breederId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicBreederCard> {
  ensureObjectId(breederId, "breeder id");

  const breeder = await Breeder.findById(breederId).lean();
  if (!breeder) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId
      ? await hasAcceptedHorseBreederRelationship(requesterUserId, breederId)
      : false;
  const hasCollaboration =
    requesterUserId ? await hasActiveBreederCollaboration(requesterUserId, breederId) : false;

  const visibilityContext: BreederDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseBreederRelationship: hasRelationship,
    hasActiveCollaboration: hasCollaboration,
  };

  if (!canViewBreederDiscovery(breeder as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Breeder not found", "NOT_FOUND");
  }

  return buildPublicBreederCard(breeder as Record<string, unknown>);
}
