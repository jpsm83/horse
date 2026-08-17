/**
 * Entity subscription catalog — roster band shape for paid entities (Stable at launch).
 *
 * Euro amounts mirror product/monetization.md placeholders. Bands suggest price;
 * the persisted `monthlyPriceCents` on the entity wins at checkout.
 */

import { catalogBandEnums, billingCurrencyEnums } from "../../utils/enums.ts";

export type CatalogBandId = (typeof catalogBandEnums)[number];
export type BillingCurrencyCode = (typeof billingCurrencyEnums)[number];

export { catalogBandEnums, billingCurrencyEnums };

export interface CatalogBand {
  id: CatalogBandId;
  name: string;
  minRoster: number;
  maxRoster: number | null;
  description: string;
}

/** Default free-trial length for new paid entities (days). */
export const DEFAULT_ENTITY_TRIAL_DAYS = 30;

/** Scale band floor (cents) — 61–74 horses stay at Large price. */
export const SCALE_PRICE_FLOOR_CENTS_EUR = 29_900;

export const ENTITY_CATALOG_BANDS: Record<CatalogBandId, CatalogBand> = {
  starter: {
    id: "starter",
    name: "Starter",
    minRoster: 1,
    maxRoster: 5,
    description: "1–5 horses on roster",
  },
  small: {
    id: "small",
    name: "Small",
    minRoster: 6,
    maxRoster: 15,
    description: "6–15 horses on roster",
  },
  medium: {
    id: "medium",
    name: "Medium",
    minRoster: 16,
    maxRoster: 30,
    description: "16–30 horses on roster",
  },
  large: {
    id: "large",
    name: "Large",
    minRoster: 31,
    maxRoster: 60,
    description: "31–60 horses on roster",
  },
  scale: {
    id: "scale",
    name: "Scale",
    minRoster: 61,
    maxRoster: null,
    description: "61+ horses — per-horse pricing with floor",
  },
};

const EUR_BAND_PRICES: Record<Exclude<CatalogBandId, "scale">, number> = {
  starter: 4_900,
  small: 9_900,
  medium: 17_900,
  large: 29_900,
};

/** Suggest a catalog band from current roster size (not an enforced cap). */
export function suggestCatalogBand(rosterCount: number): CatalogBandId {
  if (rosterCount <= 5) return "starter";
  if (rosterCount <= 15) return "small";
  if (rosterCount <= 30) return "medium";
  if (rosterCount <= 60) return "large";
  return "scale";
}

/** Monthly price in cents for a band. Scale uses per-horse × €4 with €299 floor. */
export function catalogPriceCents(
  bandId: CatalogBandId,
  currency: BillingCurrencyCode,
  rosterCount = 1,
): number {
  if (currency !== "EUR") {
    // USD/GBP use same band shape; list prices TBD in product — mirror EUR for now.
    return catalogPriceCents(bandId, "EUR", rosterCount);
  }

  if (bandId === "scale") {
    const perHorse = rosterCount * 400;
    return Math.max(perHorse, SCALE_PRICE_FLOOR_CENTS_EUR);
  }

  return EUR_BAND_PRICES[bandId];
}

export function getCatalogBand(bandId: CatalogBandId): CatalogBand {
  const band = ENTITY_CATALOG_BANDS[bandId];
  if (!band) throw new Error(`Unknown catalog band: ${bandId}`);
  return band;
}
