import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import HorseEvent from "@/models/HorseEvent.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import {
  assertCanViewHorseGlobal,
  canAccessByItemVisibilityMode,
  canViewHorseHubSection,
  resolveHorseViewerAudience,
} from "@/lib/horses/horseVisibilityAccess.ts";
import { assertPublicReadAllowed } from "@/lib/lifecycle/activeQuery.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";
import type { CreatePlanningEventInput } from "@/lib/validations/horsePlanningForms.ts";

export type PublicPlanningItem = {
  id: string;
  horseId: string;
  eventType: string;
  title: string;
  description?: string;
  start: string;
  end?: string;
  allDay: boolean;
  location?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
  visibilityMode: string;
  createdAt: string;
};

function toPublic(record: Record<string, unknown>): PublicPlanningItem {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    eventType: record.eventType as string,
    title: record.title as string,
    description: record.description as string | undefined,
    start: (record.startDate as Date).toISOString(),
    end: record.endDate ? (record.endDate as Date).toISOString() : undefined,
    allDay: record.allDay as boolean,
    location: record.location as string | undefined,
    sourceEntityType: record.sourceEntityType as string | undefined,
    sourceEntityId: record.sourceEntityId ? String(record.sourceEntityId) : undefined,
    visibilityMode: record.visibilityMode as string,
    createdAt: (record.createdAt as Date).toISOString(),
  };
}

/**
 * List planning events for a horse.
 * Layer 1 deny → 404. Owner team → full list. Others: Layer 2 planning, then item modes.
 */
export async function listPlanning(
  horseId: string,
  from?: string,
  to?: string,
  requester?: { id?: string; isAuthenticated?: boolean },
): Promise<PublicPlanningItem[]> {
  if (!mongoose.Types.ObjectId.isValid(horseId)) {
    throw new ApiError(400, "Invalid horse id", "VALIDATION_ERROR");
  }

  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }

  const horseDoc = horse as Record<string, unknown>;
  await assertPublicReadAllowed(horseDoc, "Horse");

  const audience = await resolveHorseViewerAudience(horseDoc, requester?.id);
  assertCanViewHorseGlobal(horseDoc, audience);

  const query: Record<string, unknown> = { horseId, isActive: true };
  if (from || to) {
    query.startDate = {};
    if (from) (query.startDate as Record<string, unknown>).$gte = new Date(from);
    if (to) (query.startDate as Record<string, unknown>).$lte = new Date(to);
  }
  const events = await HorseEvent.find(query).sort({ startDate: 1 }).lean();

  if (audience.isOwnerTeam) {
    return events.map((item) => toPublic(item as Record<string, unknown>));
  }

  if (!canViewHorseHubSection(horseDoc, "planning", audience)) {
    return [];
  }

  return events
    .filter((item) =>
      canAccessByItemVisibilityMode(
        (item as Record<string, unknown>).visibilityMode as string | undefined,
        audience,
      ),
    )
    .map((item) => toPublic(item as Record<string, unknown>));
}

export async function createPlanningItem(
  userId: string,
  horseId: string,
  input: CreatePlanningEventInput,
): Promise<PublicPlanningItem> {
  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }
  if (!userOwnsEntity(userId, horse as Record<string, unknown>)) {
    throw new ApiError(403, "Only the owner team can create planning events", "FORBIDDEN");
  }

  const event = await HorseEvent.create({
    eventType: input.eventType,
    title: input.title,
    location: input.location,
    horseId,
    createdByUserId: userId,
    startDate: new Date(input.startDate),
    endDate: input.endDate ? new Date(input.endDate) : undefined,
    visibilityMode: "public",
  });
  recordAudit({
    horseId,
    actorId: userId,
    actionType: "event.created",
    description: `Event "${input.title}" scheduled`,
  }).catch(() => {});
  return toPublic(event.toObject());
}

export async function listProviderPlanning(
  horseId: string,
  providerIds: string[],
  from?: string,
  to?: string,
): Promise<PublicPlanningItem[]> {
  if (providerIds.length === 0) return [];
  const query: Record<string, unknown> = {
    horseId,
    isActive: true,
    sourceEntityId: { $in: providerIds },
  };
  if (from || to) {
    query.startDate = {};
    if (from) (query.startDate as Record<string, unknown>).$gte = new Date(from);
    if (to) (query.startDate as Record<string, unknown>).$lte = new Date(to);
  }
  const events = await HorseEvent.find(query).sort({ startDate: 1 }).lean();
  return events.map((item) => toPublic(item as Record<string, unknown>));
}
