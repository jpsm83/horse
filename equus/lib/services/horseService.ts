/**
 * Horse service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/horses` routes. Route handlers stay thin; ownership, visibility,
 * and contact resolution rules live here.
 */

import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import {
  canViewHorseDiscovery,
  type HorseDiscoveryRequesterContext,
} from "@/lib/horses/horseDiscoveryAccess.ts";
import { resolveHorsePublicContact } from "@/lib/horses/resolveHorsePublicContact.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import {
  resolveAudienceForRequester,
  type RequesterVisibilityContext,
} from "@/lib/privacy/userVisibility.ts";
import type { z } from "zod";
import type {
  createHorseSchema,
  updateHorseDiscoverySchema,
} from "@/lib/validations/horse.ts";

export type CreateHorseInput = z.infer<typeof createHorseSchema>;
export type UpdateHorseDiscoveryInput = z.infer<typeof updateHorseDiscoverySchema>;

export type PublicHorseCard = {
  id: string;
  name?: string;
  breed?: string;
  sex?: string;
  profileVisibility?: string;
  contactDisplay: {
    useOwnerContact: boolean;
    name?: string;
    phone?: string;
    email?: string;
  };
};

export type OwnerHorseCoOwner = {
  userId: string;
  label: string;
  ownershipPercentage: number;
};

export type OwnerHorseHubSummary = {
  id: string;
  name?: string;
  breed?: string;
  sex?: string;
  isMainOwner: boolean;
  coOwners: OwnerHorseCoOwner[];
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseRelationship(
  userId: string,
  horseId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    horseId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function hasActiveHorseCollaboration(
  userId: string,
  horseId: string,
): Promise<boolean> {
  const hostingRelationships = await Relationship.find({
    horseId,
    relationshipType: "stable",
    receiverAccountType: "stable",
    status: "accepted",
  })
    .select("receiverAccountId")
    .lean();

  const stableIds = hostingRelationships
    .map((entry) => entry.receiverAccountId)
    .filter(Boolean);
  if (stableIds.length === 0) {
    return false;
  }

  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType: "stable",
    hostRoleProfileId: { $in: stableIds },
    status: "active",
    active: true,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function createHorse(actorUserId: string, input: CreateHorseInput) {
  ensureObjectId(actorUserId, "user id");

  const horse = await Horse.create({
    name: input.name,
    breed: input.breed,
    sex: input.sex,
    dateOfBirth: input.dateOfBirth,
    color: input.color,
    primaryDiscipline: input.primaryDiscipline,
    ...(input.profileVisibility ? { profileVisibility: input.profileVisibility } : {}),
    ...(input.contactDisplay ? { contactDisplay: input.contactDisplay } : {}),
    mainOwnerUserId: actorUserId,
    createdByUserId: actorUserId,
    subscription: {
      status: "trial",
      monthlyFee: 99,
      currency: "USD",
      payerUserId: actorUserId,
    },
  });

  return horse.toObject();
}

export async function updateHorseDiscovery(
  actorUserId: string,
  horseId: string,
  input: UpdateHorseDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findOne({
    _id: horseId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  if (input.profileVisibility !== undefined) {
    horse.profileVisibility = input.profileVisibility;
  }

  if (input.contactDisplay !== undefined) {
    horse.contactDisplay = {
      ...(horse.contactDisplay ?? { useOwnerContact: true }),
      ...input.contactDisplay,
    };
  }

  await horse.save();
  return horse.toObject();
}

export async function getHorseForOwner(actorUserId: string, horseId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findOne({
    _id: horseId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }
  return horse as Record<string, unknown>;
}

async function resolveUserLabel(userId: string): Promise<string> {
  const user = await User.findById(userId)
    .select("personalDetails.firstName personalDetails.lastName personalDetails.username")
    .lean();
  const pd = user?.personalDetails as
    | { firstName?: string; lastName?: string; username?: string }
    | undefined;
  return (
    [pd?.firstName, pd?.lastName].filter(Boolean).join(" ").trim() ||
    pd?.username?.trim() ||
    "A user"
  );
}

/** Owner hub summary — includes main-owner flag and co-owner list for transfer UI. */
export async function getOwnerHorseHubSummary(
  actorUserId: string,
  horseId: string,
): Promise<OwnerHorseHubSummary> {
  const horse = await getHorseForOwner(actorUserId, horseId);
  const isMainOwner = String(horse.mainOwnerUserId) === actorUserId;

  const rawCoOwners = Array.isArray(horse.coOwners)
    ? (horse.coOwners as Array<{ userId?: unknown; ownershipPercentage?: number }>)
    : [];

  const coOwners: OwnerHorseCoOwner[] = [];
  for (const entry of rawCoOwners) {
    if (entry.userId == null) continue;
    const userId = String(entry.userId);
    coOwners.push({
      userId,
      label: await resolveUserLabel(userId),
      ownershipPercentage: Number(entry.ownershipPercentage ?? 0),
    });
  }

  return {
    id: String(horse._id),
    name: horse.name as string | undefined,
    breed: horse.breed as string | undefined,
    sex: horse.sex as string | undefined,
    isMainOwner,
    coOwners,
  };
}

export async function getPublicHorseCard(
  horseId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicHorseCard> {
  ensureObjectId(horseId, "horse id");

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(horse as Record<string, unknown>, "Horse");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId ? await hasAcceptedHorseRelationship(requesterUserId, horseId) : false;
  const hasCollaboration =
    requesterUserId ? await hasActiveHorseCollaboration(requesterUserId, horseId) : false;

  const visibilityContext: HorseDiscoveryRequesterContext = {
    requesterUserId,
    isAuthenticated: requester?.isAuthenticated === true,
    hasAcceptedRelationship: hasRelationship,
    hasActiveCollaboration: hasCollaboration,
  };

  if (!canViewHorseDiscovery(horse as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const requesterContext: RequesterVisibilityContext = {
    isAuthenticated: requester?.isAuthenticated === true,
    hasRelationship,
    hasCollaboration,
    isSelf:
      typeof requesterUserId === "string" &&
      requesterUserId.length > 0 &&
      requesterUserId === String((horse as Record<string, unknown>).mainOwnerUserId),
  };
  const audience = resolveAudienceForRequester(requesterContext);

  const owner = await User.findById((horse as Record<string, unknown>).mainOwnerUserId)
    .select(
      "personalDetails.firstName personalDetails.lastName personalDetails.email personalDetails.phoneNumber preferences",
    )
    .lean();

  return {
    id: String((horse as Record<string, unknown>)._id),
    name: (horse as Record<string, unknown>).name as string | undefined,
    breed: (horse as Record<string, unknown>).breed as string | undefined,
    sex: (horse as Record<string, unknown>).sex as string | undefined,
    profileVisibility: (horse as Record<string, unknown>).profileVisibility as string | undefined,
    contactDisplay: resolveHorsePublicContact(
      horse as Record<string, unknown>,
      owner as Record<string, unknown> | null | undefined,
      audience,
    ),
  };
}

