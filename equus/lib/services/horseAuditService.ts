import Horse from "@/models/Horse.ts";
import HorseAuditLog from "@/models/HorseAuditLog.ts";
import Relationship from "@/models/Relationship.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";

type AuditInput = {
  horseId: string;
  actorId: string;
  actorLabel?: string;
  sourceType?: string;
  actionType: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export type PublicAuditLog = {
  id: string;
  horseId: string;
  actorLabel: string;
  userEmail?: string;
  userUsername?: string;
  userImageUrl?: string;
  sourceType: string;
  actionType: string;
  description: string;
  createdAt: string;
};

type UserPersonalDetails = {
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  imageUrl?: string;
};

async function resolveActorLabel(actorId: string, provided?: string): Promise<string> {
  if (provided?.trim()) return provided.trim();
  const user = await User.findById(actorId)
    .select(
      "personalDetails.firstName personalDetails.lastName personalDetails.email personalDetails.username",
    )
    .lean();
  if (!user) return actorId;
  const details = (user as { personalDetails?: UserPersonalDetails }).personalDetails;
  const name = [details?.firstName, details?.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  if (details?.username) return details.username;
  if (details?.email) return details.email;
  return actorId;
}

async function resolveSourceType(horseId: string, actorId: string): Promise<string> {
  const horse = await Horse.findById(horseId)
    .select("mainOwnerUserId coOwners responsibles")
    .lean();
  if (!horse) return "unknown";

  if (horse.mainOwnerUserId != null && String(horse.mainOwnerUserId) === actorId) {
    return "owner";
  }

  const coOwners = horse.coOwners as Array<{ userId?: unknown }> | undefined;
  if (coOwners?.some((entry) => entry.userId != null && String(entry.userId) === actorId)) {
    return "co_owner";
  }

  const responsibles = horse.responsibles as Array<{ userId?: unknown }> | undefined;
  if (responsibles?.some((entry) => entry.userId != null && String(entry.userId) === actorId)) {
    return "responsible";
  }

  const relationship = await Relationship.findOne({
    horseId,
    status: "accepted",
    $or: [{ receiverUserId: actorId }, { requesterUserId: actorId }],
  })
    .select("relationshipType")
    .lean();

  if (relationship?.relationshipType) {
    return String(relationship.relationshipType);
  }

  return "unknown";
}

export async function recordAudit(input: AuditInput): Promise<void> {
  const [actorLabel, sourceType] = await Promise.all([
    resolveActorLabel(input.actorId, input.actorLabel),
    input.sourceType
      ? Promise.resolve(input.sourceType)
      : resolveSourceType(input.horseId, input.actorId),
  ]);

  await HorseAuditLog.create({
    horseId: input.horseId,
    actorId: input.actorId,
    actorLabel,
    sourceType,
    actionType: input.actionType,
    description: input.description,
    metadata: input.metadata,
  });
}

export async function listAuditLogs(
  actorUserId: string,
  horseId: string,
  filters?: { actionType?: string; from?: string; to?: string },
): Promise<PublicAuditLog[]> {
  const horse = await Horse.findById(horseId).lean();
  if (!horse) {
    throw new ApiError(404, "Horse not found", "NOT_FOUND");
  }
  if (!userOwnsEntity(actorUserId, horse as Record<string, unknown>)) {
    throw new ApiError(403, "Only the owner team can view history", "FORBIDDEN");
  }

  const query: Record<string, unknown> = { horseId };
  if (filters?.actionType) query.actionType = filters.actionType;
  if (filters?.from || filters?.to) {
    query.createdAt = {};
    if (filters?.from) (query.createdAt as Record<string, unknown>).$gte = new Date(filters.from);
    if (filters?.to) (query.createdAt as Record<string, unknown>).$lte = new Date(filters.to);
  }

  const logs = await HorseAuditLog.find(query)
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const actorIds = [
    ...new Set(logs.map((log) => String(log.actorId)).filter(Boolean)),
  ];

  const users =
    actorIds.length > 0
      ? await User.find({ _id: { $in: actorIds } })
          .select("personalDetails.email personalDetails.username personalDetails.imageUrl")
          .lean()
      : [];

  const userById = new Map(
    users.map((user) => {
      const details = (user as { personalDetails?: UserPersonalDetails }).personalDetails;
      return [
        String(user._id),
        {
          email: details?.email?.trim() || undefined,
          username: details?.username?.trim() || undefined,
          imageUrl: details?.imageUrl?.trim() || undefined,
        },
      ] as const;
    }),
  );

  return logs.map((log) => {
    const actorId = String(log.actorId);
    const profile = userById.get(actorId);
    return {
      id: String(log._id),
      horseId: String(log.horseId),
      actorLabel: (log.actorLabel as string | undefined) ?? actorId,
      userEmail: profile?.email,
      userUsername: profile?.username,
      userImageUrl: profile?.imageUrl,
      sourceType: (log.sourceType as string | undefined) ?? "unknown",
      actionType: log.actionType as string,
      description: log.description as string,
      createdAt: (log.createdAt as Date).toISOString(),
    };
  });
}
