import HorseHealthRecord from "@/models/HorseHealthRecord.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";

export type PublicHealthRecord = {
  id: string;
  horseId: string;
  recordType: string;
  title: string;
  description?: string;
  date: string;
  performedBy?: string;
  notes?: string;
  sourceEntityType?: string;
  sourceEntityLabel?: string;
  visibilityMode: string;
  createdAt: string;
  updatedAt: string;
};

function toPublic(record: Record<string, unknown>): PublicHealthRecord {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    recordType: record.recordType as string,
    title: record.title as string,
    description: record.description as string | undefined,
    date: record.date instanceof Date ? record.date.toISOString() : String(record.date),
    performedBy: record.performedBy as string | undefined,
    notes: record.notes as string | undefined,
    sourceEntityType: record.sourceEntityType as string | undefined,
    sourceEntityLabel: record.sourceEntityLabel as string | undefined,
    visibilityMode: record.visibilityMode as string,
    createdAt: (record.createdAt as Date).toISOString(),
    updatedAt: (record.updatedAt as Date).toISOString(),
  };
}

export async function listHealthRecords(horseId: string): Promise<PublicHealthRecord[]> {
  const records = await HorseHealthRecord.find({ horseId, isActive: true })
    .sort({ date: -1 })
    .lean();
  return records.map(toPublic);
}

export async function createHealthRecord(
  userId: string,
  horseId: string,
  input: Record<string, unknown>,
): Promise<PublicHealthRecord> {
  const record = await HorseHealthRecord.create({
    ...input,
    horseId,
    createdByUserId: userId,
    date: new Date(input.date as string),
  });
  recordAudit({
    horseId,
    actorId: userId,
    actionType: "health.created",
    description: `Health record "${input.title}" added`,
  }).catch(() => {});
  return toPublic(record.toObject());
}

export async function updateHealthRecord(
  recordId: string,
  userId: string,
  input: Record<string, unknown>,
): Promise<PublicHealthRecord | null> {
  const update: Record<string, unknown> = { ...input };
  if (input.date) update.date = new Date(input.date as string);
  const record = await HorseHealthRecord.findOneAndUpdate(
    { _id: recordId, createdByUserId: userId, isActive: true },
    { $set: update },
    { new: true, runValidators: true },
  ).lean();
  return record ? toPublic(record) : null;
}

export async function deleteHealthRecord(
  recordId: string,
  userId: string,
): Promise<boolean> {
  const result = await HorseHealthRecord.updateOne(
    { _id: recordId, createdByUserId: userId },
    { $set: { isActive: false, deactivatedAt: new Date() } },
  );
  return result.modifiedCount > 0;
}
