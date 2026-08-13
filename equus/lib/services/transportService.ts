/**
 * Transport service — creation, owned-list, role-aware view, and profile flows.
 *
 * Called by `/api/v1/transports` routes. Route handlers stay thin; ownership and
 * discovery rules live here. `getTransportView` is the unified role-aware DTO
 * for all `/transport/[transportId]/*` tabs; `listTransportsForOwner` powers the
 * "my transports" page; `updateTransportProfile` is the dirty-field PATCH.
 */

import mongoose from "mongoose";
import Transport from "@/models/Transport.ts";
import Relationship from "@/models/Relationship.ts";
import WorkplaceRelationship from "@/models/WorkplaceRelationship.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { ownedByUserQuery, userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import type { z } from "zod";
import type {
  createTransportSchema,
  updateTransportDiscoverySchema,
  updateTransportProfileSchema,
} from "@/lib/validations/transport.ts";

export type CreateTransportInput = z.infer<typeof createTransportSchema>;
export type UpdateTransportDiscoveryInput = z.infer<typeof updateTransportDiscoverySchema>;
export type UpdateTransportProfileInput = z.infer<typeof updateTransportProfileSchema>;

// --- Role-aware view types ---

export type TransportTab = "hub" | "profile" | "admin";

export type TransportViewerRole =
  | "main_owner"
  | "co_owner"
  | "related"
  | "public"
  | "guest";

/** Role-scoped transport view DTO for the shared detail chrome. */
export type TransportViewDto = {
  id: string;
  companyName: string;
  description?: string;
  email?: string;
  phoneNumber?: string;
  emergencyPhoneNumber?: string;
  websiteUrl?: string;
  imageUrl?: string;
  specialties?: string[];
  serviceAreas?: string[];
  address?: {
    city?: string;
    country?: string;
    state?: string;
    street?: string;
    postCode?: string;
    buildingNumber?: string;
  };
  isPublic?: boolean;
  acceptsNewBookings?: boolean;
  isMainOwner?: boolean;
  isCoOwner?: boolean;
  isAdmin?: boolean;
};

export type TransportViewResponse = {
  viewerRole: TransportViewerRole;
  allowedTabs: TransportTab[];
  transport: TransportViewDto;
};

// --- List types ---

export type TransportListItem = {
  id: string;
  companyName: string;
  city?: string;
  country?: string;
  description?: string;
  imageUrl?: string;
  specialties?: string[];
  isPublic?: boolean;
  acceptsNewBookings?: boolean;
  updatedAt?: string;
};

export type TransportListResult = {
  transports: TransportListItem[];
  total: number;
  page: number;
  limit: number;
};

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

export async function updateTransportProfile(
  actorUserId: string,
  transportId: string,
  input: UpdateTransportProfileInput,
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

  const updated = await Transport.findByIdAndUpdate(transportId, updateOps, {
    new: true,
  }).lean();
  if (!updated) {
    throw new ApiError(404, "Transport not found", "NOT_FOUND");
  }
  return updated as Record<string, unknown>;
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

// --- Role derivation ---

export const TRANSPORT_ROLE_ORDER: TransportViewerRole[] = [
  "guest",
  "public",
  "related",
  "co_owner",
  "main_owner",
];

export const TRANSPORT_TAB_MIN_ROLE: Record<TransportTab, TransportViewerRole> = {
  hub: "guest",
  profile: "related",
  admin: "main_owner",
};

function deriveTransportViewerRole(
  transport: Record<string, unknown>,
  userId?: string | null,
  hasRelatedAccess = false,
): TransportViewerRole {
  if (!userId) return "guest";
  if (String(transport.mainOwnerUserId) === userId) return "main_owner";
  const isCoOwner = (Array.isArray(transport.coOwners) ? transport.coOwners : []).some(
    (c: { userId?: unknown }) => c.userId != null && String(c.userId) === userId,
  );
  if (isCoOwner) return "co_owner";
  if (hasRelatedAccess) return "related";
  return "public";
}

export function deriveTransportAllowedTabs(viewerRole: TransportViewerRole): TransportTab[] {
  const roleIndex = TRANSPORT_ROLE_ORDER.indexOf(viewerRole);
  return (Object.keys(TRANSPORT_TAB_MIN_ROLE) as TransportTab[]).filter((tab) => {
    const minIndex = TRANSPORT_ROLE_ORDER.indexOf(TRANSPORT_TAB_MIN_ROLE[tab]);
    return roleIndex >= minIndex;
  });
}

// --- List ---

function toTransportListItem(doc: Record<string, unknown>): TransportListItem {
  const address = (doc.address ?? {}) as Record<string, unknown>;
  return {
    id: String(doc._id),
    companyName: doc.companyName as string,
    city: address.city as string | undefined,
    country: address.country as string | undefined,
    description: doc.description as string | undefined,
    imageUrl: doc.imageUrl as string | undefined,
    specialties: doc.specialties as string[] | undefined,
    isPublic: doc.isPublic as boolean | undefined,
    acceptsNewBookings: doc.acceptsNewBookings as boolean | undefined,
    updatedAt: (doc.updatedAt as Date | undefined)?.toISOString(),
  };
}

/** List transports owned by the authenticated user ("my transports"). */
export async function listTransportsForOwner(
  actorUserId: string,
  page = 1,
  limit = 20,
): Promise<TransportListResult> {
  ensureObjectId(actorUserId, "user id");
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const skip = (safePage - 1) * safeLimit;

  const query = { ...ownedByUserQuery(actorUserId), isActive: { $ne: false } };
  const [docs, total] = await Promise.all([
    Transport.find(query).sort({ updatedAt: -1 }).skip(skip).limit(safeLimit).lean(),
    Transport.countDocuments(query),
  ]);

  return {
    transports: (docs as unknown as Record<string, unknown>[]).map(toTransportListItem),
    total,
    page: safePage,
    limit: safeLimit,
  };
}

function toTransportView(transport: Record<string, unknown>): TransportViewDto {
  const address = (transport.address ?? {}) as Record<string, unknown>;
  return {
    id: String(transport._id),
    companyName: transport.companyName as string,
    description: transport.description as string | undefined,
    email: transport.email as string | undefined,
    phoneNumber: transport.phoneNumber as string | undefined,
    emergencyPhoneNumber: transport.emergencyPhoneNumber as string | undefined,
    websiteUrl: transport.websiteUrl as string | undefined,
    imageUrl: transport.imageUrl as string | undefined,
    specialties: transport.specialties as string[] | undefined,
    serviceAreas: transport.serviceAreas as string[] | undefined,
    address: {
      city: address.city as string | undefined,
      country: address.country as string | undefined,
      state: address.state as string | undefined,
      street: address.street as string | undefined,
      postCode: address.postCode as string | undefined,
      buildingNumber: address.buildingNumber as string | undefined,
    },
    isPublic: transport.isPublic as boolean | undefined,
    acceptsNewBookings: transport.acceptsNewBookings as boolean | undefined,
  };
}

/**
 * Unified role-aware transport view — single endpoint for all transport tabs.
 * Returns the role-scoped transport, the viewer's role, and accessible tabs.
 */
export async function getTransportView(
  transportId: string,
  userId?: string | null,
): Promise<TransportViewResponse> {
  ensureObjectId(transportId, "transport id");

  const transport = await Transport.findById(transportId).lean();
  if (!transport) {
    throw new ApiError(404, "Transport not found", "NOT_FOUND");
  }

  await assertPublicReadAllowed(transport as Record<string, unknown>, "Transport");

  const transportDoc = transport as Record<string, unknown>;
  const requesterUserId = userId ?? undefined;
  const isOwner =
    typeof requesterUserId === "string" &&
    requesterUserId.length > 0 &&
    userOwnsEntity(requesterUserId, transportDoc);

  const hasRelationship = requesterUserId
    ? await hasAcceptedHorseTransportRelationship(requesterUserId, transportId)
    : false;
  const hasCollaboration = requesterUserId
    ? await hasActiveTransportCollaboration(requesterUserId, transportId)
    : false;

  if (!isOwner && transportDoc.isPublic === false && !hasRelationship && !hasCollaboration) {
    throw new ApiError(404, "Transport not found", "NOT_FOUND");
  }

  const viewerRole = deriveTransportViewerRole(
    transportDoc,
    userId,
    hasRelationship || hasCollaboration,
  );
  const allowedTabs = deriveTransportAllowedTabs(viewerRole);

  const view = toTransportView(transportDoc);
  if (isOwner && requesterUserId) {
    const isMainOwner = String(transportDoc.mainOwnerUserId) === requesterUserId;
    const isCoOwner = (Array.isArray(transportDoc.coOwners) ? transportDoc.coOwners : []).some(
      (c: { userId?: unknown }) => c.userId != null && String(c.userId) === requesterUserId,
    );
    view.isMainOwner = isMainOwner;
    view.isCoOwner = isCoOwner;
    view.isAdmin = isMainOwner || isCoOwner;
  }

  return { viewerRole, allowedTabs, transport: view };
}
