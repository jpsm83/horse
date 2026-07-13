import HorseFeedPlan from "@/models/HorseFeedPlan.ts";
import { recordAudit } from "@/lib/services/horseAuditService.ts";

export type PublicFeedPlan = {
  id: string;
  horseId: string;
  mealTime: string;
  feedType: string;
  quantity?: string;
  unit?: string;
  supplements?: Array<{ name: string; quantity?: string; unit?: string }>;
  notes?: string;
  isActive: boolean;
  scheduleDays?: string[];
  sourceEntityType?: string;
  visibilityMode: string;
  createdAt: string;
  updatedAt: string;
};

function toPublic(record: Record<string, unknown>): PublicFeedPlan {
  return {
    id: String(record._id),
    horseId: String(record.horseId),
    mealTime: record.mealTime as string,
    feedType: record.feedType as string,
    quantity: record.quantity as string | undefined,
    unit: record.unit as string | undefined,
    supplements: record.supplements as Array<{ name: string; quantity?: string; unit?: string }> | undefined,
    notes: record.notes as string | undefined,
    isActive: record.isActive as boolean,
    scheduleDays: record.scheduleDays as string[] | undefined,
    sourceEntityType: record.sourceEntityType as string | undefined,
    visibilityMode: record.visibilityMode as string,
    createdAt: (record.createdAt as Date).toISOString(),
    updatedAt: (record.updatedAt as Date).toISOString(),
  };
}

export async function listFeedPlans(horseId: string): Promise<PublicFeedPlan[]> {
  const plans = await HorseFeedPlan.find({ horseId, isActive: true })
    .sort({ mealTime: 1 })
    .lean();
  return plans.map(toPublic);
}

export async function createFeedPlan(
  userId: string,
  horseId: string,
  input: Record<string, unknown>,
): Promise<PublicFeedPlan> {
  const plan = await HorseFeedPlan.create({
    ...input,
    horseId,
    createdByUserId: userId,
  });
  recordAudit({
    horseId,
    actorId: userId,
    actionType: "feed.created",
    description: `Feed plan "${input.feedType}" added`,
  }).catch(() => {});
  return toPublic(plan.toObject());
}

export async function updateFeedPlan(
  planId: string,
  userId: string,
  input: Record<string, unknown>,
): Promise<PublicFeedPlan | null> {
  const plan = await HorseFeedPlan.findOneAndUpdate(
    { _id: planId, createdByUserId: userId, isActive: true },
    { $set: input },
    { new: true, runValidators: true },
  ).lean();
  return plan ? toPublic(plan) : null;
}

export async function deleteFeedPlan(planId: string, userId: string): Promise<boolean> {
  const result = await HorseFeedPlan.updateOne(
    { _id: planId, createdByUserId: userId },
    { $set: { isActive: false, deactivatedAt: new Date() } },
  );
  return result.modifiedCount > 0;
}
