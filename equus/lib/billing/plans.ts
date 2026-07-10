export type TierId = "free" | "bronze" | "silver" | "gold" | "diamond";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "BRL" | "CAD" | "AUD" | "CHF" | "JPY";

export interface SubscriptionPlan {
  id: TierId;
  name: string;
  horseLimit: number;
  prices: Record<CurrencyCode, number>;
  description: string;
}

export const SUBSCRIPTION_PLANS: Record<TierId, SubscriptionPlan> = {
  free: {
    id: "free", name: "Free", horseLimit: 1,
    prices: { USD: 0, EUR: 0, GBP: 0, BRL: 0, CAD: 0, AUD: 0, CHF: 0, JPY: 0 },
    description: "Perfect for trying out the platform with one horse.",
  },
  bronze: {
    id: "bronze", name: "Bronze", horseLimit: 3,
    prices: { USD: 8900, EUR: 7900, GBP: 6900, BRL: 34900, CAD: 11900, AUD: 12900, CHF: 7900, JPY: 980000 },
    description: "For owners with 2-3 horses.",
  },
  silver: {
    id: "silver", name: "Silver", horseLimit: 5,
    prices: { USD: 14900, EUR: 13900, GBP: 11900, BRL: 54900, CAD: 19900, AUD: 21900, CHF: 13900, JPY: 1500000 },
    description: "For committed owners with up to 5 horses.",
  },
  gold: {
    id: "gold", name: "Gold", horseLimit: 8,
    prices: { USD: 21900, EUR: 19900, GBP: 17900, BRL: 79900, CAD: 29900, AUD: 31900, CHF: 19900, JPY: 2200000 },
    description: "For serious competitors and semi-professionals.",
  },
  diamond: {
    id: "diamond", name: "Diamond", horseLimit: Infinity,
    prices: { USD: 32900, EUR: 29900, GBP: 26900, BRL: 119900, CAD: 43900, AUD: 47900, CHF: 29900, JPY: 3500000 },
    description: "Unlimited horses for professionals and breeders.",
  },
};

export function getPlan(tierId: TierId): SubscriptionPlan {
  const plan = SUBSCRIPTION_PLANS[tierId];
  if (!plan) throw new Error(`Unknown tier: ${tierId}`);
  return plan;
}

export function getPlanByHorseCount(count: number): TierId {
  const tiers: [TierId, number][] = [
    ["diamond", Infinity],
    ["gold", 8],
    ["silver", 5],
    ["bronze", 3],
    ["free", 1],
  ];
  for (const [tierId, limit] of tiers) {
    if (count <= limit) return tierId;
  }
  return "diamond";
}

export function getEffectivePrice(tierId: TierId, currency: CurrencyCode, discountPercent: number): number {
  const plan = getPlan(tierId);
  const basePrice = plan.prices[currency];
  if (!basePrice) throw new Error(`No price for ${currency} in ${tierId}`);
  if (discountPercent <= 0) return basePrice;
  return Math.round(basePrice * (1 - discountPercent / 100));
}

export const tierEnums = ["free", "bronze", "silver", "gold", "diamond"] as const;
