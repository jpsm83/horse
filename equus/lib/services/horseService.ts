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

// --- List types ---

export type HorseListItem = {
  id: string;
  name?: string;
  breed?: string;
  sex?: string;
  color?: string;
  primaryDiscipline?: string;
  profileImageUrl?: string;
  profileVisibility?: string;
  updatedAt?: string;
};

export type HorseListResult = {
  horses: HorseListItem[];
  total: number;
  page: number;
  limit: number;
};

export type HorseListFilters = {
  mine?: boolean;
  breed?: string;
  sex?: string;
  countryOfBirth?: string;
  ageMin?: number;
  ageMax?: number;
  valueMin?: number;
  valueMax?: number;
  page?: number;
  limit?: number;
};

// --- Public card type ---

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

  const doc: Record<string, unknown> = {
    name: input.name,
    breed: input.breed,
    sex: input.sex,
    mainOwnerUserId: actorUserId,
    createdByUserId: actorUserId,
    registration: {
      payerUserId: actorUserId,
    },
  };

  // Identity
  if (input.registeredName) doc.registeredName = input.registeredName;
  if (input.registryId) doc.registryId = input.registryId;
  if (input.microchipId) doc.microchipId = input.microchipId;
  if (input.passportNumber) doc.passportNumber = input.passportNumber;
  if (input.dateOfBirth) doc.dateOfBirth = input.dateOfBirth;
  if (input.ageYears !== undefined) doc.ageYears = input.ageYears;
  if (input.color) doc.color = input.color;
  if (input.marksDescription) doc.marksDescription = input.marksDescription;
  if (input.heightHands !== undefined) doc.heightHands = input.heightHands;
  if (input.primaryDiscipline) doc.primaryDiscipline = input.primaryDiscipline;
  if (input.disciplines && input.disciplines.length > 0) doc.disciplines = input.disciplines;
  if (input.countryOfBirth) doc.countryOfBirth = input.countryOfBirth;
  if (input.importExportStatus) doc.importExportStatus = input.importExportStatus;

  // Commercial
  if (input.estimatedValue !== undefined) doc.estimatedValue = input.estimatedValue;
  if (input.valueCurrency) doc.valueCurrency = input.valueCurrency;
  if (input.saleStatus) doc.saleStatus = input.saleStatus;
  if (input.askingPrice !== undefined) doc.askingPrice = input.askingPrice;
  if (input.acquisitionDate) doc.acquisitionDate = input.acquisitionDate;
  if (input.acquisitionSource) doc.acquisitionSource = input.acquisitionSource;
  if (input.showValuePublicly !== undefined) doc.showValuePublicly = input.showValuePublicly;

  // Pedigree
  if (input.pedigree) {
    const pedigree: Record<string, unknown> = {};
    if (input.pedigree.sireName) pedigree.sireName = input.pedigree.sireName;
    if (input.pedigree.sireId) pedigree.sireId = input.pedigree.sireId;
    if (input.pedigree.damName) pedigree.damName = input.pedigree.damName;
    if (input.pedigree.damId) pedigree.damId = input.pedigree.damId;
    if (input.pedigree.bloodlineNotes) pedigree.bloodlineNotes = input.pedigree.bloodlineNotes;
    doc.pedigree = pedigree;
  }

  // Media
  if (input.profileImageUrl) doc.profileImageUrl = input.profileImageUrl;
  if (input.gallery && input.gallery.length > 0) {
    doc.gallery = input.gallery.map((url: string) => ({
      url,
      type: url.match(/\.(mp4|webm|mov|avi|mkv)$/i) ? "video" : "image",
    }));
  }
  if (input.description) doc.description = input.description;
  if (input.notes) doc.notes = input.notes;

  // Discovery
  if (input.profileVisibility) doc.profileVisibility = input.profileVisibility;
  if (input.contactDisplay) doc.contactDisplay = input.contactDisplay;

  const horse = await Horse.create(doc);
  return horse.toObject();
}

// --- List ---

function toHorseListItem(doc: Record<string, unknown>): HorseListItem {
  return {
    id: String(doc._id),
    name: doc.name as string | undefined,
    breed: doc.breed as string | undefined,
    sex: doc.sex as string | undefined,
    color: doc.color as string | undefined,
    primaryDiscipline: doc.primaryDiscipline as string | undefined,
    profileImageUrl: doc.profileImageUrl as string | undefined,
    profileVisibility: doc.profileVisibility as string | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

export async function listHorses(
  actorUserId: string | undefined,
  filters: HorseListFilters,
): Promise<HorseListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(100, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  let query: Record<string, unknown> = {};

  if (filters.mine && actorUserId) {
    query = { ...ownedByUserQuery(actorUserId) };
  } else {
    query.profileVisibility = "public";
    query.isActive = { $ne: false };
  }

  // Apply optional filters
  if (filters.breed) {
    query.breed = filters.breed;
  }
  if (filters.sex) {
    query.sex = filters.sex;
  }
  if (filters.countryOfBirth) {
    query.countryOfBirth = { $regex: filters.countryOfBirth, $options: "i" };
  }
  if (filters.ageMin !== undefined || filters.ageMax !== undefined) {
    const ageFilter: Record<string, number> = {};
    if (filters.ageMin !== undefined) ageFilter.$gte = filters.ageMin;
    if (filters.ageMax !== undefined) ageFilter.$lte = filters.ageMax;
    query.ageYears = ageFilter;
  }
  if (filters.valueMin !== undefined || filters.valueMax !== undefined) {
    const valueFilter: Record<string, number> = {};
    if (filters.valueMin !== undefined) valueFilter.$gte = filters.valueMin;
    if (filters.valueMax !== undefined) valueFilter.$lte = filters.valueMax;
    query.estimatedValue = valueFilter;
  }

  const [docs, total] = await Promise.all([
    Horse.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Horse.countDocuments(query),
  ]);

  return {
    horses: (docs as Record<string, unknown>[]).map(toHorseListItem),
    total,
    page,
    limit,
  };
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

