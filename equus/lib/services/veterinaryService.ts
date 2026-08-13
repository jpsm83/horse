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
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createVeterinarySchema,
  updateVeterinaryDiscoverySchema,
  updateVeterinaryProfileSchema,
} from "@/lib/validations/veterinary.ts";

export type CreateVeterinaryInput = z.infer<typeof createVeterinarySchema>;
export type UpdateVeterinaryDiscoveryInput = z.infer<typeof updateVeterinaryDiscoverySchema>;
export type UpdateVeterinaryProfileInput = z.infer<typeof updateVeterinaryProfileSchema>;

// --- Role-aware view types ---

export type VeterinaryTab = "hub" | "profile";

export type VeterinaryViewerRole = "owner" | "related" | "public" | "guest";

/** Role-scoped veterinary view DTO for the shared detail chrome. */
export type VeterinaryViewDto = {
  id: string;
  practiceName: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  emergencyPhoneNumber?: string;
  address?: {
    city?: string;
    country?: string;
    state?: string;
    street?: string;
    postCode?: string;
    buildingNumber?: string;
  };
  legalName?: string;
  equineSpecializations?: { name: string; description?: string }[];
  certifications?: string[];
  licenseNumber?: string;
  emergencyAvailability?: boolean;
  emergencyCoverageNotes?: string;
  serviceAreaKm?: number;
  isPublic?: boolean;
  acceptsNewPatients?: boolean;
  isOwner?: boolean;
};

export type VeterinaryViewResponse = {
  viewerRole: VeterinaryViewerRole;
  allowedTabs: VeterinaryTab[];
  veterinary: VeterinaryViewDto;
};

// --- List types ---

export type VeterinaryListItem = {
  id: string;
  practiceName: string;
  city?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  equineSpecializations?: { name: string; description?: string }[];
  isPublic?: boolean;
  acceptsNewPatients?: boolean;
  updatedAt?: string;
};

export type VeterinaryListResult = {
  veterinaries: VeterinaryListItem[];
};

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

// --- Role derivation ---

export const VETERINARY_ROLE_ORDER: VeterinaryViewerRole[] = [
  "guest",
  "public",
  "related",
  "owner",
];

export const VETERINARY_TAB_MIN_ROLE: Record<VeterinaryTab, VeterinaryViewerRole> = {
  hub: "guest",
  profile: "owner",
};

function deriveVeterinaryViewerRole(
  veterinary: Record<string, unknown>,
  userId?: string | null,
  hasRelationship = false,
): VeterinaryViewerRole {
  if (!userId) return "guest";
  if (String(veterinary.userId) === userId) return "owner";
  if (hasRelationship) return "related";
  return "public";
}

export function deriveVeterinaryAllowedTabs(
  viewerRole: VeterinaryViewerRole,
): VeterinaryTab[] {
  const roleIndex = VETERINARY_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(VETERINARY_TAB_MIN_ROLE) as VeterinaryTab[]).filter((tab) => {
    const minIndex = VETERINARY_ROLE_ORDER.indexOf(VETERINARY_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- List ---

function toVeterinaryListItem(doc: Record<string, unknown>): VeterinaryListItem {
  const address = (doc.address ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    practiceName: doc.practiceName as string,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    description: doc.description as string | undefined,
    imageUrl: doc.imageUrl as string | undefined,
    equineSpecializations: doc.equineSpecializations as
      | { name: string; description?: string }[]
      | undefined,
    isPublic: doc.isPublic as boolean | undefined,
    acceptsNewPatients: doc.acceptsNewPatients as boolean | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

/**
 * List veterinary profiles owned by the authenticated user ("my veterinary
 * practice"). User-linked roles hold at most one profile per user, so this
 * returns either a single entry or an empty array.
 */
export async function listVeterinariesForOwner(
  actorUserId: string,
): Promise<VeterinaryListResult> {
  ensureObjectId(actorUserId, "user id");

  const docs = await Veterinary.find({ userId: actorUserId, isActive: { $ne: false } })
    .sort({ updatedAt: -1 })
    .lean();

  return {
    veterinaries: (docs as unknown as Record<string, unknown>[]).map(toVeterinaryListItem),
  };
}

function toVeterinaryView(veterinary: Record<string, unknown>): VeterinaryViewDto {
  const address = (veterinary.address ?? {}) as Record<string, unknown>;
  return {
    id: String(veterinary._id),
    practiceName: veterinary.practiceName as string,
    description: veterinary.description as string | undefined,
    email: veterinary.email as string | undefined,
    phoneNumber: veterinary.phoneNumber as string | undefined,
    emergencyPhoneNumber: veterinary.emergencyPhoneNumber as string | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    legalName: veterinary.legalName as string | undefined,
    equineSpecializations: veterinary.equineSpecializations as
      | { name: string; description?: string }[]
      | undefined,
    certifications: veterinary.certifications as string[] | undefined,
    licenseNumber: veterinary.licenseNumber as string | undefined,
    emergencyAvailability: veterinary.emergencyAvailability as boolean | undefined,
    emergencyCoverageNotes: veterinary.emergencyCoverageNotes as string | undefined,
    serviceAreaKm: veterinary.serviceAreaKm as number | undefined,
    isPublic: veterinary.isPublic as boolean | undefined,
    acceptsNewPatients: veterinary.acceptsNewPatients as boolean | undefined,
  };
}

/**
 * Unified role-aware veterinary view — single endpoint for all veterinary tabs.
 * Returns the role-scoped veterinary, the viewer's role, and accessible tabs.
 * Ownership is user-linked (`Veterinary.userId`); `isOwner` flags the profile tab.
 */
export async function getVeterinaryView(
  veterinaryId: string,
  userId?: string | null,
): Promise<VeterinaryViewResponse> {
  ensureObjectId(veterinaryId, "veterinary id");

  const veterinary = await Veterinary.findById(veterinaryId).lean();
  if (!veterinary) {
    throw new ApiError(404, "Veterinary profile not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(veterinary as Record<string, unknown>, "Veterinary");

  const veterinaryDoc = veterinary as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsVeterinaryProfile(requesterUserId, veterinaryDoc);

  const hasRelationship = requesterUserId
    ? await hasAcceptedHorseVeterinaryRelationship(requesterUserId, veterinaryId)
    : false;

  if (!isOwner && veterinaryDoc.isPublic === false && !hasRelationship) {
    throw new ApiError(404, "Veterinary profile not found", "NOT_FOUND");
  }

  const viewerRole = deriveVeterinaryViewerRole(veterinaryDoc, userId, hasRelationship);
  const allowedTabs = deriveVeterinaryAllowedTabs(viewerRole);

  const view = toVeterinaryView(veterinaryDoc);
  if (isOwner && requesterUserId) {
    view.isOwner = true;
  }

  return { viewerRole, allowedTabs, veterinary: view };
}

/**
 * Owner profile update — dirty-field `$set`/`$unset` PATCH. Empty strings clear
 * optional fields (`$unset`); nested address keys update via dotted paths.
 * Verifies the actor owns the profile (`Veterinary.userId === actorUserId`).
 */
export async function updateVeterinaryProfile(
  actorUserId: string,
  veterinaryId: string,
  input: UpdateVeterinaryProfileInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(veterinaryId, "veterinary id");

  const veterinary = await Veterinary.findOne({
    _id: veterinaryId,
    userId: actorUserId,
  });
  if (!veterinary) {
    throw new ApiError(404, "Veterinary profile not found", "NOT_FOUND");
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

  const updated = await Veterinary.findByIdAndUpdate(veterinaryId, updateOps, {
    new: true,
  }).lean();
  if (!updated) {
    throw new ApiError(404, "Veterinary profile not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
}

export { userOwnsVeterinaryProfile };
