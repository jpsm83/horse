import { describe, expect, it } from "vitest";
import { updateHorseDiscoverySchema } from "@/lib/validations/horse.ts";

describe("updateHorseDiscoverySchema", () => {
  it("sanitizes profile visibility updates", () => {
    const parsed = updateHorseDiscoverySchema.parse({
      profileVisibility: "relationship",
    });

    expect(parsed.profileVisibility).toBe("relationship");
  });

  it("rejects unknown visibility", () => {
    expect(() =>
      updateHorseDiscoverySchema.parse({
        profileVisibility: "friends_only",
      }),
    ).toThrow();
  });
});
