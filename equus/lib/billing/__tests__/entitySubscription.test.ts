/**
 * Entity subscription helpers — good standing and default trial state.
 */

import { describe, expect, it } from "vitest";

import {
  buildDefaultEntitySubscription,
  isEntityInGoodStanding,
} from "@/lib/billing/entitySubscription.ts";

describe("entitySubscription", () => {
  it("buildDefaultEntitySubscription starts a 30-day trial on starter band", () => {
    const sub = buildDefaultEntitySubscription("EUR");
    expect(sub.status).toBe("trialing");
    expect(sub.catalogBand).toBe("starter");
    expect(sub.monthlyPriceCents).toBe(4900);
    expect(sub.trialEndsAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("isEntityInGoodStanding returns true during trialing window", () => {
    expect(
      isEntityInGoodStanding({
        status: "trialing",
        trialEndsAt: new Date(Date.now() + 86_400_000),
      }),
    ).toBe(true);
  });

  it("isEntityInGoodStanding returns false when write_locked", () => {
    expect(isEntityInGoodStanding({ status: "write_locked" })).toBe(false);
  });

  it("isEntityInGoodStanding returns false when trial expired", () => {
    expect(
      isEntityInGoodStanding({
        status: "trialing",
        trialEndsAt: new Date(Date.now() - 1000),
      }),
    ).toBe(false);
  });
});
