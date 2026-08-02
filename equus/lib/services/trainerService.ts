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
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createTrainerSchema,
  updateTrainerDiscoverySchema,
  updateTrainerProfileSchema,
} from "@/lib/validations/trainer.ts";

export type CreateTrainerInput = z.infer<typeof createTrainerSchema>;
export type UpdateTrainerDiscoveryInput = z.infer<typeof updateTrainerDiscoverySchema>;
export type UpdateTrainerProfileInput = z.infer<typeof updateTrainerProfileSchema>;

export type { PublicTrainerCard };

// --- Role-aware view types ---

export type TrainerTab = "hub" | "profile";

export type TrainerViewerRole = "owner" | "related" | "public" | "guest";

/** Role-scoped trainer view DTO for the shared detail chrome. */
export type TrainerViewDto = {
  id: string;
  displayName: string;
  bio?: string;
  email?: string;
  phoneNumber?: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
    street?: string;
    postCode?: string;
    buildingNumber?: string;
  };
  legalName?: string;
  specialties?: string[];
  experienceYears?: number;
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  isOwner?: boolean;
};

export type TrainerViewResponse = {
  viewerRole: TrainerViewerRole;
  allowedTabs: TrainerTab[];
  trainer: TrainerViewDto;
};

// --- List types ---

export type TrainerListItem = {
  id: string;
  displayName: string;
  city?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  specialties?: string[];
  isPublic?: boolean;
  acceptsNewClients?: boolean;
  updatedAt?: string;
};

export type TrainerListResult = {
  trainers: TrainerListItem[];
};

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

  await assertPublicReadAllowed(trainer as Record<string, unknown>, "Trainer");

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

// --- Role derivation ---

export const TRAINER_ROLE_ORDER: TrainerViewerRole[] = [
  "guest",
  "public",
  "related",
  "owner",
];

export const TRAINER_TAB_MIN_ROLE: Record<TrainerTab, TrainerViewerRole> = {
  hub: "guest",
  profile: "owner",
};

function deriveTrainerViewerRole(
  trainer: Record<string, unknown>,
  userId?: string | null,
  hasRelationship = false,
): TrainerViewerRole {
  if (!userId) return "guest";
  if (String(trainer.userId) === userId) return "owner";
  if (hasRelationship) return "related";
  return "public";
}

export function deriveTrainerAllowedTabs(viewerRole: TrainerViewerRole): TrainerTab[] {
  const roleIndex = TRAINER_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(TRAINER_TAB_MIN_ROLE) as TrainerTab[]).filter((tab) => {
    const minIndex = TRAINER_ROLE_ORDER.indexOf(TRAINER_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- List ---

function toTrainerListItem(doc: Record<string, unknown>): TrainerListItem {
  const address = (doc.address ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    displayName: doc.displayName as string,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    description: doc.bio as string | undefined,
    imageUrl: doc.imageUrl as string | undefined,
    specialties: doc.specialties as string[] | undefined,
    isPublic: doc.isPublic as boolean | undefined,
    acceptsNewClients: doc.acceptsNewClients as boolean | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

/**
 * List trainer profiles owned by the authenticated user ("my trainer profile").
 * User-linked roles hold at most one profile per user, so this returns either a
 * single entry or an empty array.
 */
export async function listTrainersForOwner(
  actorUserId: string,
): Promise<TrainerListResult> {
  ensureObjectId(actorUserId, "user id");

  const docs = await Trainer.find({ userId: actorUserId, isActive: { $ne: false } })
    .sort({ updatedAt: -1 })
    .lean();

  return {
    trainers: (docs as unknown as Record<string, unknown>[]).map(toTrainerListItem),
  };
}

function toTrainerView(trainer: Record<string, unknown>): TrainerViewDto {
  const address = (trainer.address ?? {}) as Record<string, unknown>;
  return {
    id: String(trainer._id),
    displayName: trainer.displayName as string,
    bio: trainer.bio as string | undefined,
    email: trainer.email as string | undefined,
    phoneNumber: trainer.phoneNumber as string | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    legalName: trainer.legalName as string | undefined,
    specialties: trainer.specialties as string[] | undefined,
    experienceYears: trainer.experienceYears as number | undefined,
    isPublic: trainer.isPublic as boolean | undefined,
    acceptsNewClients: trainer.acceptsNewClients as boolean | undefined,
  };
}

/**
 * Unified role-aware trainer view — single endpoint for all trainer tabs.
 * Returns the role-scoped trainer, the viewer's role, and accessible tabs.
 * Ownership is user-linked (`Trainer.userId`); `isOwner` flags the profile tab.
 */
export async function getTrainerView(
  trainerId: string,
  userId?: string | null,
): Promise<TrainerViewResponse> {
  ensureObjectId(trainerId, "trainer id");

  const trainer = await Trainer.findById(trainerId).lean();
  if (!trainer) {
    throw new ApiError(404, "Trainer not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(trainer as Record<string, unknown>, "Trainer");

  const trainerDoc = trainer as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsTrainerProfile(requesterUserId, trainerDoc);

  const hasRelationship = requesterUserId
    ? await hasAcceptedHorseTrainerRelationship(requesterUserId, trainerId)
    : false;

  if (!isOwner && trainerDoc.isPublic === false && !hasRelationship) {
    throw new ApiError(404, "Trainer not found", "NOT_FOUND");
  }

  const viewerRole = deriveTrainerViewerRole(trainerDoc, userId, hasRelationship);
  const allowedTabs = deriveTrainerAllowedTabs(viewerRole);

  const view = toTrainerView(trainerDoc);
  if (isOwner && requesterUserId) {
    view.isOwner = true;
  }

  return { viewerRole, allowedTabs, trainer: view };
}

/**
 * Owner profile update — dirty-field `$set`/`$unset` PATCH. Empty strings clear
 * optional fields (`$unset`); nested address keys update via dotted paths.
 * Verifies the actor owns the profile (`Trainer.userId === actorUserId`).
 */
export async function updateTrainerProfile(
  actorUserId: string,
  trainerId: string,
  input: UpdateTrainerProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(trainerId, "trainer id");

  const trainer = await Trainer.findOne({ _id: trainerId, userId: actorUserId });
  if (!trainer) {
    throw new ApiError(404, "Trainer not found", "NOT_FOUND");
  }

  const updates: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;

    if (key === "address") {
      if (typeof value === "object" && value !== null) {
        for (const [addrKey, addrValue] of Object.entries(value)) {
          if (addrValue !== undefined) {
            updates[`address.${addrKey}`] = addrValue;
          }
        }
      }
      continue;
    }

    if (typeof value === "string" && value.trim() === "") {
      unset[key] = 1;
      continue;
    }

    updates[key] = value;
  }

  const updateOps: Record<string, unknown> = {};
  if (Object.keys(updates).length > 0) updateOps.$set = updates;
  if (Object.keys(unset).length > 0) updateOps.$unset = unset;

  const updated = await Trainer.findByIdAndUpdate(trainerId, updateOps, { new: true }).lean();
  if (!updated) {
    throw new ApiError(404, "Trainer not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

export { userOwnsTrainerProfile };
