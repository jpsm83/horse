import mongoose from "mongoose";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import { getPlan, getPlanByHorseCount, type TierId } from "./plans.ts";

export async function countUserOwnedHorses(userId: string): Promise<number> {
  return Horse.countDocuments({
    mainOwnerUserId: new mongoose.Types.ObjectId(userId),
    "registration.isActive": true,
  });
}

export async function getUserHorseUsage(userId: string): Promise<{
  current: number;
  limit: number;
  tierId: TierId;
  remaining: number;
}> {
  const user = await User.findById(userId).select("subscription.tier").lean();
  if (!user) throw new Error("User not found");
  const plan = getPlan(user.subscription.tier as TierId);
  const current = await countUserOwnedHorses(userId);
  return {
    current,
    limit: plan.horseLimit,
    tierId: plan.id,
    remaining: plan.horseLimit === Infinity ? Infinity : plan.horseLimit - current,
  };
}

export async function canUserAddHorse(userId: string): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  requiredTier: TierId | null;
}> {
  const usage = await getUserHorseUsage(userId);
  if (usage.remaining > 0) {
    return { allowed: true, current: usage.current, limit: usage.limit, requiredTier: null };
  }
  const requiredTier = getPlanByHorseCount(usage.current + 1);
  return { allowed: false, current: usage.current, limit: usage.limit, requiredTier };
}
