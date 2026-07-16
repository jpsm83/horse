import HorseEvent from "@/models/HorseEvent.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";

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
    visibilityMode: record.visibilityMode as string,
    createdAt: (record.createdAt as Date).toISOString(),
  };
}

export async function listPlanning(
  horseId: string,
  from?: string,
  to?: string,
): Promise<PublicPlanningItem[]> {
  const query: Record<string, unknown> = { horseId, isActive: true };
  if (from || to) {
    query.startDate = {};
    if (from) (query.startDate as Record<string, unknown>).$gte = new Date(from);
    if (to) (query.startDate as Record<string, unknown>).$lte = new Date(to);
  }
  const events = await HorseEvent.find(query).sort({ startDate: 1 }).lean();
  return events.map(toPublic);
}

export async function createPlanningItem(
  userId: string,
  horseId: string,
  input: Record<string, unknown>,
): Promise<PublicPlanningItem> {
  const event = await HorseEvent.create({
    ...input,
    horseId,
    createdByUserId: userId,
    startDate: new Date(input.startDate as string),
    endDate: input.endDate ? new Date(input.endDate as string) : undefined,
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
  return events.map(toPublic);
}
