import { canUserAddHorse, getUserHorseUsage } from "./horseCounter.ts";
import { getPlan, type TierId } from "./plans.ts";

export async function guardHorseCreation(userId: string) {
  const result = await canUserAddHorse(userId);
  if (result.allowed) return { ok: true as const };
  return {
    ok: false as const,
    code: "HORSE_LIMIT_REACHED" as const,
    current: result.current,
    limit: result.limit,
    requiredTier: result.requiredTier,
  };
}

export async function guardPlanDowngrade(userId: string, newTier: TierId) {
  const usage = await getUserHorseUsage(userId);
  const plan = getPlan(newTier);
  if (usage.current <= plan.horseLimit) return { ok: true as const };
  const excess = usage.current - plan.horseLimit;
  return {
    ok: false as const,
    code: "DOWNGRADE_EXCEEDS_LIMIT" as const,
    reason: `You have ${usage.current} horses. ${plan.name} allows ${plan.horseLimit}. Remove or transfer ${excess} horse(s) before downgrading.`,
    excess,
  };
}

export async function guardAcceptTransfer(userId: string) {
  const result = await canUserAddHorse(userId);
  if (result.allowed) return { ok: true as const };
  return {
    ok: false as const,
    code: "TRANSFER_EXCEEDS_LIMIT" as const,
    current: result.current,
    limit: result.limit,
    requiredTier: result.requiredTier,
  };
}
