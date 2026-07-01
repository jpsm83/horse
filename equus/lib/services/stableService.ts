/**
 * Stable service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/stables` routes. Route handlers stay thin; ownership and
 * discovery rules live here.
 */

import mongoose from "mongoose";
import Stable from "@/models/Stable.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import {
  canViewStableDiscovery,
  type StableDiscoveryRequesterContext,
} from "@/lib/stables/stableDiscoveryAccess.ts";
import {
  buildPublicStableCard,
  type PublicStableCard,
} from "@/lib/stables/buildPublicStableCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createStableSchema,
  updateStableDiscoverySchema,
} from "@/lib/validations/stable.ts";

export type CreateStableInput = z.infer<typeof createStableSchema>;
export type UpdateStableDiscoveryInput = z.infer<typeof updateStableDiscoverySchema>;

export type { PublicStableCard };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseStableRelationship(
  userId: string,
  stableId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "stable",
    receiverAccountType: "stable",
    receiverAccountId: stableId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function hasActiveStableCollaboration(
  userId: string,
  stableId: string,
): Promise<boolean> {
  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType: "stable",
    hostRoleProfileId: stableId,
    status: "active",
    active: true,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function createStable(actorUserId: string, input: CreateStableInput) {
  ensureObjectId(actorUserId, "user id");

  const stable = await Stable.create({
    mainOwnerUserId: actorUserId,
    tradeName: input.tradeName,
    description: input.description,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.websiteUrl ? { websiteUrl: input.websiteUrl } : {}),
    ...(input.disciplines ? { disciplines: input.disciplines } : {}),
    ...(input.services ? { services: input.services } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewHorses !== undefined
      ? { acceptsNewHorses: input.acceptsNewHorses }
      : {}),
  });

  return stable.toObject();
}

export async function updateStableDiscovery(
  actorUserId: string,
  stableId: string,
  input: UpdateStableDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(stableId, "stable id");

  const stable = await Stable.findOne({
    _id: stableId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!stable) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    stable.isPublic = input.isPublic;
  }

  if (input.acceptsNewHorses !== undefined) {
    stable.acceptsNewHorses = input.acceptsNewHorses;
  }

  await stable.save();
  return stable.toObject();
}

export async function getStableForOwner(actorUserId: string, stableId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(stableId, "stable id");

  const stable = await Stable.findOne({
    _id: stableId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!stable) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }
  return stable as Record<string, unknown>;
}

export async function getPublicStableCard(
  stableId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicStableCard> {
  ensureObjectId(stableId, "stable id");

  const stable = await Stable.findById(stableId).lean();
  if (!stable) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(stable as Record<string, unknown>, "Stable");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId
      ? await hasAcceptedHorseStableRelationship(requesterUserId, stableId)
      : false;
  const hasCollaboration =
    requesterUserId ? await hasActiveStableCollaboration(requesterUserId, stableId) : false;

  const visibilityContext: StableDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseStableRelationship: hasRelationship,
    hasActiveCollaboration: hasCollaboration,
  };

  if (!canViewStableDiscovery(stable as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Stable not found", "NOT_FOUND");
  }

  return buildPublicStableCard(stable as Record<string, unknown>);
}
