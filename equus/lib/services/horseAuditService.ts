import HorseAuditLog from "@/models/HorseAuditLog.ts";

type AuditInput = {
  horseId: string;
  actorId: string;
  actorLabel?: string;
  actionType: string;
  description: string;
  metadata?: Record<string, unknown>;
};

export async function recordAudit(input: AuditInput): Promise<void> {
  await HorseAuditLog.create(input);
}

export type PublicAuditLog = {
  id: string;
  horseId: string;
  actorLabel: string;
  actionType: string;
  description: string;
  createdAt: string;
};

export async function listAuditLogs(
  horseId: string,
  filters?: { actionType?: string; from?: string; to?: string },
): Promise<PublicAuditLog[]> {
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

  return logs.map((log) => ({
    id: String(log._id),
    horseId: String(log.horseId),
    actorLabel: log.actorLabel ?? String(log.actorId),
    actionType: log.actionType as string,
    description: log.description as string,
    createdAt: (log.createdAt as Date).toISOString(),
  }));
}
