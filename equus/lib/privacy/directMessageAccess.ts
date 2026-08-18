/**
 * Direct message access — blocks + target DM preference enforcement.
 *
 * Used by chatService before find-or-create thread and send message.
 */

import mongoose from "mongoose";

import Breeder from "@/models/Breeder.ts";
import Horse from "@/models/Horse.ts";
import RidingClub from "@/models/RidingClub.ts";
import Stable from "@/models/Stable.ts";
import Transport from "@/models/Transport.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import {
  hasAcceptedRelationshipBetweenUsers,
  hasActiveCollaborationBetweenUsers,
} from "@/lib/privacy/userPublicProfile.ts";
import { canStartDirectMessage, resolveAudienceForRequester } from "@/lib/privacy/userVisibility.ts";
import { isDocumentActive } from "@/lib/lifecycle/activeQuery.ts";

type UserBlockEntry = { blockedUserId?: unknown };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

function sharedCoOwnershipQuery(userA: string, userB: string): Record<string, unknown> {
  const a = new mongoose.Types.ObjectId(userA);
  const b = new mongoose.Types.ObjectId(userB);
  return {
    $or: [
      { mainOwnerUserId: a, "coOwners.userId": b },
      { mainOwnerUserId: b, "coOwners.userId": a },
      { "coOwners.userId": { $all: [a, b] } },
    ],
  };
}

async function hasSharedEntityCoOwnership(userA: string, userB: string): Promise<boolean> {
  const query = sharedCoOwnershipQuery(userA, userB);
  const [horse, stable, ridingClub, breeder, transport] = await Promise.all([
    Horse.exists(query),
    Stable.exists(query),
    RidingClub.exists(query),
    Breeder.exists(query),
    Transport.exists(query),
  ]);
  return [horse, stable, ridingClub, breeder, transport].some((entry) => entry !== null);
}

async function userHasBlocked(otherUserId: string, blockedUserId: string): Promise<boolean> {
  const user = await User.findById(otherUserId).select("blocks").lean();
  const blocks = (user?.blocks ?? []) as UserBlockEntry[];
  return blocks.some((entry) => entry.blockedUserId != null && String(entry.blockedUserId) === blockedUserId);
}

export async function isEitherUserBlocked(userA: string, userB: string): Promise<boolean> {
  const [aBlocksB, bBlocksA] = await Promise.all([
    userHasBlocked(userA, userB),
    userHasBlocked(userB, userA),
  ]);
  return aBlocksB || bBlocksA;
}

export async function assertCanDirectMessage(
  senderUserId: string,
  targetUserId: string,
): Promise<void> {
  ensureObjectId(senderUserId, "sender user id");
  ensureObjectId(targetUserId, "target user id");

  if (senderUserId === targetUserId) {
    throw new ApiError(400, "Cannot message yourself", "VALIDATION_ERROR");
  }

  if (await isEitherUserBlocked(senderUserId, targetUserId)) {
    throw new ApiError(403, "Direct messaging is blocked", "FORBIDDEN");
  }

  const target = await User.findById(targetUserId).select("isActive preferences").lean();
  if (!isDocumentActive(target)) {
    throw new ApiError(404, "User not found", "NOT_FOUND");
  }

  const [hasRelationship, hasCollaboration, hasCoOwnership] = await Promise.all([
    hasAcceptedRelationshipBetweenUsers(senderUserId, targetUserId),
    hasActiveCollaborationBetweenUsers(senderUserId, targetUserId),
    hasSharedEntityCoOwnership(senderUserId, targetUserId),
  ]);

  const audience = resolveAudienceForRequester({
    isAuthenticated: true,
    hasRelationship,
    hasCollaboration: hasCollaboration || hasCoOwnership,
  });

  const preferences = (target?.preferences ?? {}) as Record<string, unknown>;
  if (!canStartDirectMessage(preferences, audience)) {
    throw new ApiError(403, "Direct messaging is not allowed", "FORBIDDEN");
  }
}
