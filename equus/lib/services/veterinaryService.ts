/**
 * Veterinary service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/veterinaries` routes. Route handlers stay thin; user-linked
 * ownership and discovery rules live here.
 */

import mongoose from "mongoose";
import Veterinary from "@/models/Veterinary.ts";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsVeterinaryProfile } from "@/lib/veterinaries/userLinkedProfileAccess.ts";
import {
  canViewVeterinaryDiscovery,
  type VeterinaryDiscoveryRequesterContext,
} from "@/lib/veterinaries/veterinaryDiscoveryAccess.ts";
import {
  buildPublicVeterinaryCard,
  type PublicVeterinaryCard,
} from "@/lib/veterinaries/buildPublicVeterinaryCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createVeterinarySchema,
  updateVeterinaryDiscoverySchema,
} from "@/lib/validations/veterinary.ts";

export type CreateVeterinaryInput = z.infer<typeof createVeterinarySchema>;
export type UpdateVeterinaryDiscoveryInput = z.infer<typeof updateVeterinaryDiscoverySchema>;

export type { PublicVeterinaryCard };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseVeterinaryRelationship(
  userId: string,
  veterinaryId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "veterinary",
    receiverAccountType: "veterinary",
    receiverAccountId: veterinaryId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

export async function createVeterinary(actorUserId: string, input: CreateVeterinaryInput) {
  ensureObjectId(actorUserId, "user id");

  const user = await User.findById(actorUserId).select("veterinaryProfileId").lean();
  if (!user) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }
  if (user.veterinaryProfileId) {
    throw new ApiError(409, "Veterinary profile already exists for this user", "CONFLICT");
  }

  const veterinary = await Veterinary.create({
    userId: actorUserId,
    practiceName: input.practiceName,
    description: input.description,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.emergencyPhoneNumber ? { emergencyPhoneNumber: input.emergencyPhoneNumber } : {}),
    ...(input.equineSpecializations ? { equineSpecializations: input.equineSpecializations } : {}),
    ...(input.certifications ? { certifications: input.certifications } : {}),
    ...(input.licenseNumber ? { licenseNumber: input.licenseNumber } : {}),
    ...(input.emergencyAvailability !== undefined
      ? { emergencyAvailability: input.emergencyAvailability }
      : {}),
    ...(input.emergencyCoverageNotes
      ? { emergencyCoverageNotes: input.emergencyCoverageNotes }
      : {}),
    ...(input.serviceAreaKm !== undefined ? { serviceAreaKm: input.serviceAreaKm } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewPatients !== undefined
      ? { acceptsNewPatients: input.acceptsNewPatients }
      : {}),
  });

  const linked = await User.findOneAndUpdate(
    { _id: actorUserId, veterinaryProfileId: { $exists: false } },
    { veterinaryProfileId: veterinary._id },
    { returnDocument: "after" },
  ).select("veterinaryProfileId");

  if (!linked) {
    await Veterinary.findByIdAndDelete(veterinary._id);
    throw new ApiError(409, "Veterinary profile already exists for this user", "CONFLICT");
  }

  return veterinary.toObject();
}

export async function updateVeterinaryDiscovery(
  actorUserId: string,
  veterinaryId: string,
  input: UpdateVeterinaryDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(veterinaryId, "veterinary id");

  const veterinary = await Veterinary.findOne({ _id: veterinaryId, userId: actorUserId });
  if (!veterinary) {
    throw new ApiError(404, "Veterinary profile not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    veterinary.isPublic = input.isPublic;
  }

  if (input.acceptsNewPatients !== undefined) {
    veterinary.acceptsNewPatients = input.acceptsNewPatients;
  }

  await veterinary.save();
  return veterinary.toObject();
}

export async function getVeterinaryForOwner(actorUserId: string, veterinaryId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(veterinaryId, "veterinary id");

  const veterinary = await Veterinary.findOne({ _id: veterinaryId, userId: actorUserId }).lean();
  if (!veterinary) {
    throw new ApiError(404, "Veterinary profile not found", "NOT_FOUND");
  }
  return veterinary as Record<string, unknown>;
}

export async function getPublicVeterinaryCard(
  veterinaryId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicVeterinaryCard> {
  ensureObjectId(veterinaryId, "veterinary id");

  const veterinary = await Veterinary.findById(veterinaryId).lean();
  if (!veterinary) {
    throw new ApiError(404, "Veterinary profile not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(veterinary as Record<string, unknown>, "Veterinary");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId
      ? await hasAcceptedHorseVeterinaryRelationship(requesterUserId, veterinaryId)
      : false;

  const visibilityContext: VeterinaryDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseVeterinaryRelationship: hasRelationship,
  };

  if (!canViewVeterinaryDiscovery(veterinary as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Veterinary profile not found", "NOT_FOUND");
  }

  return buildPublicVeterinaryCard(veterinary as Record<string, unknown>);
}

export { userOwnsVeterinaryProfile };
