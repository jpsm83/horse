/**
 * Entity catalog band suggestions and pricing shape.
 */

import { describe, expect, it } from "vitest";

import {
  catalogPriceCents,
  suggestCatalogBand,
  SCALE_PRICE_FLOOR_CENTS_EUR,
} from "@/lib/billing/entityCatalog.ts";

describe("entityCatalog", () => {
  it("suggests bands from roster count", () => {
    expect(suggestCatalogBand(3)).toBe("starter");
    expect(suggestCatalogBand(10)).toBe("small");
    expect(suggestCatalogBand(20)).toBe("medium");
    expect(suggestCatalogBand(40)).toBe("large");
    expect(suggestCatalogBand(80)).toBe("scale");
  });

  it("applies scale floor for 61–74 horses", () => {
    expect(catalogPriceCents("scale", "EUR", 65)).toBe(SCALE_PRICE_FLOOR_CENTS_EUR);
  });

  it("uses per-horse pricing from 75 horses", () => {
    expect(catalogPriceCents("scale", "EUR", 75)).toBe(75 * 400);
  });
});
