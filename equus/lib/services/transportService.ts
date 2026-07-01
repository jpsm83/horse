/**
 * Transport service — creation and discovery/public-read flows.
 *
 * Called by `/api/v1/transports` routes. Route handlers stay thin; ownership and
 * discovery rules live here.
 */

import mongoose from "mongoose";
import Transport from "@/models/Transport.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery } from "@/lib/ownership/entityOwnership.ts";
import {
  canViewTransportDiscovery,
  type TransportDiscoveryRequesterContext,
} from "@/lib/transports/transportDiscoveryAccess.ts";
import {
  buildPublicTransportCard,
  type PublicTransportCard,
} from "@/lib/transports/buildPublicTransportCard.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createTransportSchema,
  updateTransportDiscoverySchema,
} from "@/lib/validations/transport.ts";

export type CreateTransportInput = z.infer<typeof createTransportSchema>;
export type UpdateTransportDiscoveryInput = z.infer<typeof updateTransportDiscoverySchema>;

export type { PublicTransportCard };

function ensureObjectId(id: string, fieldName: string): void {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${fieldName}`, "VALIDATION_ERROR");
  }
}

async function hasAcceptedHorseTransportRelationship(
  userId: string,
  transportId: string,
): Promise<boolean> {
  const relationship = await Relationship.findOne({
    relationshipType: "transport",
    receiverAccountType: "transport",
    receiverAccountId: transportId,
    status: "accepted",
    $or: [{ requesterUserId: userId }, { receiverUserId: userId }],
  })
    .select("_id")
    .lean();

  return Boolean(relationship);
}

async function hasActiveTransportCollaboration(
  userId: string,
  transportId: string,
): Promise<boolean> {
  const collaboration = await WorkplaceRelationship.findOne({
    userId,
    hostRoleType: "transport",
    hostRoleProfileId: transportId,
    status: "active",
    active: true,
  })
    .select("_id")
    .lean();

  return Boolean(collaboration);
}

export async function createTransport(actorUserId: string, input: CreateTransportInput) {
  ensureObjectId(actorUserId, "user id");

  const transport = await Transport.create({
    mainOwnerUserId: actorUserId,
    companyName: input.companyName,
    description: input.description,
    email: input.email,
    phoneNumber: input.phoneNumber,
    address: input.address,
    ...(input.legalName ? { legalName: input.legalName } : {}),
    ...(input.websiteUrl ? { websiteUrl: input.websiteUrl } : {}),
    ...(input.emergencyPhoneNumber ? { emergencyPhoneNumber: input.emergencyPhoneNumber } : {}),
    ...(input.specialties ? { specialties: input.specialties } : {}),
    ...(input.serviceAreas ? { serviceAreas: input.serviceAreas } : {}),
    ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
    ...(input.acceptsNewBookings !== undefined
      ? { acceptsNewBookings: input.acceptsNewBookings }
      : {}),
  });

  return transport.toObject();
}

export async function updateTransportDiscovery(
  actorUserId: string,
  transportId: string,
  input: UpdateTransportDiscoveryInput,
) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(transportId, "transport id");

  const transport = await Transport.findOne({
    _id: transportId,
    ...ownedByUserQuery(actorUserId),
  });
  if (!transport) {
    throw new ApiError(404, "Transport not found", "NOT_FOUND");
  }

  if (input.isPublic !== undefined) {
    transport.isPublic = input.isPublic;
  }

  if (input.acceptsNewBookings !== undefined) {
    transport.acceptsNewBookings = input.acceptsNewBookings;
  }

  await transport.save();
  return transport.toObject();
}

export async function getTransportForOwner(actorUserId: string, transportId: string) {
  ensureObjectId(actorUserId, "user id");
  ensureObjectId(transportId, "transport id");

  const transport = await Transport.findOne({
    _id: transportId,
    ...ownedByUserQuery(actorUserId),
  }).lean();
  if (!transport) {
    throw new ApiError(404, "Transport not found", "NOT_FOUND");
  }
  return transport as Record<string, unknown>;
}

export async function getPublicTransportCard(
  transportId: string,
  requester?: { id?: string; isAuthenticated: boolean },
): Promise<PublicTransportCard> {
  ensureObjectId(transportId, "transport id");

  const transport = await Transport.findById(transportId).lean();
  if (!transport) {
    throw new ApiError(404, "Transport not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(transport as Record<string, unknown>, "Transport");

  const requesterUserId = requester?.id;
  const hasRelationship =
    requesterUserId
      ? await hasAcceptedHorseTransportRelationship(requesterUserId, transportId)
      : false;
  const hasCollaboration =
    requesterUserId
      ? await hasActiveTransportCollaboration(requesterUserId, transportId)
      : false;

  const visibilityContext: TransportDiscoveryRequesterContext = {
    requesterUserId,
    hasAcceptedHorseTransportRelationship: hasRelationship,
    hasActiveCollaboration: hasCollaboration,
  };

  if (!canViewTransportDiscovery(transport as Record<string, unknown>, visibilityContext)) {
    throw new ApiError(404, "Transport not found", "NOT_FOUND");
  }

  return buildPublicTransportCard(transport as Record<string, unknown>);
}
