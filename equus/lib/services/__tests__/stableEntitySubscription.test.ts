/**
 * Stable create — entity subscription trial defaults (Block 26).
 */

import { describe, expect, it } from "vitest";

import * as userService from "@/lib/services/userService.ts";
import * as stableService from "@/lib/services/stableService.ts";
import Stable from "@/models/Stable.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("stable entity subscription", () => {
  it("createStable initializes trialing subscription with 30-day window", async () => {
    const owner = await userService.createCredentialsUser({
      email: "stable-billing-owner@example.com",
      password: "TestPass1!",
      firstName: "Stable",
    });

    const stable = await stableService.createStable(String(owner._id), {
      tradeName: "Billing Stable",
      description: "Trial test",
      email: "billing-stable@example.com",
      phoneNumber: "+351900000001",
      address: minimalAddress,
    });

    const reloaded = await Stable.findById(stable._id).lean();
    const sub = (reloaded as { subscription?: Record<string, unknown> })?.subscription;
    expect(sub?.status).toBe("trialing");
    expect(sub?.catalogBand).toBe("starter");
    expect(sub?.monthlyPriceCents).toBe(4900);
    expect(sub?.trialEndsAt).toBeTruthy();
  });
});
