import { describe, expect, it } from "vitest";
import {
  horseContactDisplaySchema,
  updateHorseDiscoverySchema,
} from "@/lib/validations/horse.ts";

describe("updateHorseDiscoverySchema", () => {
  it("sanitizes profile visibility updates", () => {
    const parsed = updateHorseDiscoverySchema.parse({
      profileVisibility: "relationship",
    });

    expect(parsed.profileVisibility).toBe("relationship");
  });

  it("accepts owner contact display", () => {
    const parsed = updateHorseDiscoverySchema.parse({
      contactDisplay: { useOwnerContact: true },
    });

    expect(parsed.contactDisplay?.useOwnerContact).toBe(true);
  });

  it("requires delegate contact fields when useOwnerContact is false", () => {
    expect(() =>
      updateHorseDiscoverySchema.parse({
        contactDisplay: { useOwnerContact: false },
      }),
    ).toThrow();
  });

  it("accepts full delegate contact", () => {
    const parsed = updateHorseDiscoverySchema.parse({
      contactDisplay: {
        useOwnerContact: false,
        name: "  Barn Manager  ",
        phone: "+351912345678",
        email: "Barn@Example.com",
      },
    });

    expect(parsed.contactDisplay?.name).toBe("Barn Manager");
    expect(parsed.contactDisplay?.email).toBe("barn@example.com");
  });
});

describe("horseContactDisplaySchema", () => {
  it("rejects invalid email on delegate contact", () => {
    expect(() =>
      horseContactDisplaySchema.parse({
        useOwnerContact: false,
        name: "Manager",
        phone: "+351912345678",
        email: "not-an-email",
      }),
    ).toThrow();
  });
});
