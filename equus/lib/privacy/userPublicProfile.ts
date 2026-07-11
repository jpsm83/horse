/**
 * Public user profile reads — entity-linked user cards with visibility enforcement.
 *
 * Called by `GET /api/v1/users/:id` (UA-06) and future entity owner links.
 * Users are never searchable; this service only resolves deep-linked profile views.
 */

import mongoose from "mongoose";
import User from "@/models/User.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import Stable from "@/models/Stable.ts";
import Breeder from "@/models/Breeder.ts";
import RidingClub from "@/models/RidingClub.ts";
import Transport from "@/models/Transport.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { isDocumentActive } from "@/lib/lifecycle/activeQuery.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import type { BusinessRoleType } from "@/lib/roleProfiles/businessRoleProfile.ts";
import {
  businessRoleTypeEnums,
} from "@/utils/enums.ts";
import {
  canExposeUserIdentity,
  resolveAudienceForRequester,
  toPublicUserIdentity,
} from "@/lib/privacy/userVisibility.ts";

export type PublicUserProfileRequester = {
  id?: string;
  isAuthenticated: boolean;
};

/** Safe user card for entity-linked profile pages (no secrets or preferences). */
export type PublicUserProfileCard = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  username?: string;
  imageUrl?: string;
  bio?: string;
  businessName?: string;
};

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

function workplaceKey(roleType: string, profileId: unknown): string {
  return `${roleType}:${String(profileId)}`;
}

async function hasAcceptedRelationshipBetweenUsers(
  requesterUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    status: "accepted",
    $or: [
      { requesterUserId, receiverUserId: targetUserId },
      { requesterUserId: targetUserId, receiverUserId: requesterUserId },
    ],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function listOwnedHostProfiles(
  userId: string,
): Promise<Array<{ roleType: BusinessRoleType; profileId: string }>> {
  const [stables, breeders, ridingClubs, transports] = await Promise.all([
    Stable.find(ownedByUserQuery(userId)).select("_id").lean(),
    Breeder.find(ownedByUserQuery(userId)).select("_id").lean(),
    RidingClub.find(ownedByUserQuery(userId)).select("_id").lean(),
    Transport.find(ownedByUserQuery(userId)).select("_id").lean(),
  ]);

  return [
    ...stables.map((doc) => ({ roleType: "stable" as const, profileId: String(doc._id) })),
    ...breeders.map((doc) => ({ roleType: "breeder" as const, profileId: String(doc._id) })),
    ...ridingClubs.map((doc) => ({
      roleType: "ridingClub" as const,
      profileId: String(doc._id),
    })),
    ...transports.map((doc) => ({ roleType: "transport" as const, profileId: String(doc._id) })),
  ];
}

async function hasActiveCollaborationAtHost(
  collaboratorUserId: string,
  roleType: BusinessRoleType,
  profileId: string,
): Promise<boolean> {
  const exists = await WorkplaceRelationship.exists({
    userId: collaboratorUserId,
    hostRoleType: roleType,
    hostRoleProfileId: profileId,
    status: "active",
    active: true,
  });

  return exists !== null;
}

async function hasActiveCollaborationBetweenUsers(
  requesterUserId: string,
  targetUserId: string,
): Promise<boolean> {
  const [requesterCollabs, targetCollabs] = await Promise.all([
    WorkplaceRelationship.find({
      userId: requesterUserId,
      status: "active",
      active: true,
      hostRoleType: { $in: businessRoleTypeEnums },
    })
      .select("hostRoleType hostRoleProfileId")
      .lean(),
    WorkplaceRelationship.find({
      userId: targetUserId,
      status: "active",
      active: true,
      hostRoleType: { $in: businessRoleTypeEnums },
    })
      .select("hostRoleType hostRoleProfileId")
      .lean(),
  ]);

  const targetKeys = new Set(
    targetCollabs.map((entry) => workplaceKey(String(entry.hostRoleType), entry.hostRoleProfileId)),
  );
  if (
    requesterCollabs.some((entry) =>
      targetKeys.has(workplaceKey(String(entry.hostRoleType), entry.hostRoleProfileId)),
    )
  ) {
    return true;
  }

  const requesterOwned = await listOwnedHostProfiles(requesterUserId);
  for (const host of requesterOwned) {
    if (await hasActiveCollaborationAtHost(targetUserId, host.roleType, host.profileId)) {
      return true;
    }
  }

  const targetOwned = await listOwnedHostProfiles(targetUserId);
  for (const host of targetOwned) {
    if (await hasActiveCollaborationAtHost(requesterUserId, host.roleType, host.profileId)) {
      return true;
    }
  }

  return false;
}

function mapPublicUserProfileCard(
  doc: Record<string, unknown>,
  audience: Parameters<typeof toPublicUserIdentity>[1],
): PublicUserProfileCard {
  const identity = toPublicUserIdentity(doc, audience);
  if (!identity) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const personalDetails = (doc.personalDetails ?? {}) as Record<string, unknown>;
  const card: PublicUserProfileCard = { id: identity.id };

  if (identity.firstName) card.firstName = identity.firstName;
  if (identity.lastName) card.lastName = identity.lastName;
  if (identity.email) card.email = identity.email;
  if (identity.phone) card.phone = identity.phone;

  if (typeof personalDetails.username === "string" && personalDetails.username.trim()) {
    card.username = personalDetails.username;
  }
  if (typeof personalDetails.imageUrl === "string" && personalDetails.imageUrl.trim()) {
    card.imageUrl = personalDetails.imageUrl;
  }
  if (typeof personalDetails.bio === "string" && personalDetails.bio.trim()) {
    card.bio = personalDetails.bio;
  }

  if (identity.businessName) {
    card.businessName = identity.businessName;
  }

  return card;
}

/**
 * Load a user profile card for a requester, enforcing `profileVisibility`.
 * Returns 404 when the user is missing, inactive, or the audience is not allowed.
 */
export async function getPublicUserForRequester(
  targetUserId: string,
  requester?: PublicUserProfileRequester,
): Promise<PublicUserProfileCard> {
  ensureObjectId(targetUserId, "user id");

  const user = await User.findById(targetUserId)
    .select(
      "isActive personalDetails.username personalDetails.firstName personalDetails.lastName personalDetails.email personalDetails.phoneNumber personalDetails.imageUrl personalDetails.bio preferences userType businessDetails.businessName",
    )
    .lean();

  if (!isDocumentActive(user)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const requesterUserId = requester?.id;
  const isSelf =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    requesterUserId === targetUserId;

  const hasRelationship =
    requesterUserId && !isSelf
      ? await hasAcceptedRelationshipBetweenUsers(requesterUserId, targetUserId)
      : false;
  const hasCollaboration =
    requesterUserId && !isSelf
      ? await hasActiveCollaborationBetweenUsers(requesterUserId, targetUserId)
      : false;

  const audience = resolveAudienceForRequester({
    isAuthenticated: requester?.isAuthenticated === true || isSelf,
    hasRelationship,
    hasCollaboration,
    isSelf,
  });

  const doc = user as Record<string, unknown>;
  const preferences = (doc.preferences ?? {}) as Record<string, unknown>;

  if (!canExposeUserIdentity(preferences, audience)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  return mapPublicUserProfileCard(doc, audience);
}
