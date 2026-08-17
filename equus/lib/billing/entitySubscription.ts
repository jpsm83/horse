/**
 * Entity subscription helpers — good-standing checks and default subscription state.
 *
 * Subscription fields live on the paid entity (Stable at launch). Stripe customer is
 * the owning User; subscription ids and status are stored on the entity document.
 */

import {
  catalogPriceCents,
  DEFAULT_ENTITY_TRIAL_DAYS,
  suggestCatalogBand,
  type BillingCurrencyCode,
  type CatalogBandId,
} from "./entityCatalog.ts";
import { countStableRoster } from "./rosterMeter.ts";

export type EntitySubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "write_locked"
  | "canceled";

export type EntitySubscriptionFields = {
  status?: EntitySubscriptionStatus;
  catalogBand?: CatalogBandId;
  monthlyPriceCents?: number;
  currency?: BillingCurrencyCode;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialEndsAt?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  canceledAt?: Date;
};

export type EntityBillingDto = {
  status: EntitySubscriptionStatus;
  catalogBand: CatalogBandId;
  monthlyPriceCents: number;
  currency: BillingCurrencyCode;
  rosterCount: number;
  suggestedBand: CatalogBandId;
  inGoodStanding: boolean;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  hasStripeSubscription: boolean;
};

export function buildDefaultEntitySubscription(
  currency: BillingCurrencyCode = "EUR",
): Required<
  Pick<EntitySubscriptionFields, "status" | "catalogBand" | "monthlyPriceCents" | "currency" | "trialEndsAt">
> {
  const trialEndsAt = new Date(Date.now() + DEFAULT_ENTITY_TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const catalogBand: CatalogBandId = "starter";
  return {
    status: "trialing",
    catalogBand,
    monthlyPriceCents: catalogPriceCents(catalogBand, currency),
    currency,
    trialEndsAt,
  };
}

/** Good standing = trialing (within window), active, or past_due (grace — not write_locked yet). */
export function isEntityInGoodStanding(sub: EntitySubscriptionFields | undefined | null): boolean {
  if (!sub?.status) return true;

  switch (sub.status) {
    case "trialing":
      return Boolean(sub.trialEndsAt && sub.trialEndsAt.getTime() > Date.now());
    case "active":
    case "past_due":
      return true;
    case "write_locked":
    case "canceled":
      return false;
    default:
      return false;
  }
}

export async function buildStableBillingDto(
  stableId: string,
  sub: EntitySubscriptionFields | undefined | null,
): Promise<EntityBillingDto> {
  const rosterCount = await countStableRoster(stableId);
  const suggestedBand = suggestCatalogBand(rosterCount);
  const defaults = buildDefaultEntitySubscription(sub?.currency ?? "EUR");

  const status = sub?.status ?? defaults.status;
  const catalogBand = sub?.catalogBand ?? defaults.catalogBand;
  const monthlyPriceCents = sub?.monthlyPriceCents ?? defaults.monthlyPriceCents;
  const currency = sub?.currency ?? defaults.currency;

  return {
    status,
    catalogBand,
    monthlyPriceCents,
    currency,
    rosterCount,
    suggestedBand,
    inGoodStanding: isEntityInGoodStanding({
      status,
      trialEndsAt: sub?.trialEndsAt,
    }),
    trialEndsAt: sub?.trialEndsAt?.toISOString(),
    currentPeriodEnd: sub?.currentPeriodEnd?.toISOString(),
    hasStripeSubscription: Boolean(sub?.stripeSubscriptionId),
  };
}
