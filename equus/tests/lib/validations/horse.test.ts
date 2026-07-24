import { describe, expect, it } from "vitest";
import {
  updateHorseDiscoverySchema,
  updateHorseHubSectionsSchema,
} from "@/lib/validations/horse.ts";

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

  it("does not accept hubSections", () => {
    const parsed = updateHorseDiscoverySchema.parse({
      profileVisibility: "public",
      hubSections: { identity: { mode: "owner" } },
    });
    expect(parsed).toEqual({ profileVisibility: "public" });
    expect("hubSections" in parsed).toBe(false);
  });
});

describe("updateHorseHubSectionsSchema", () => {
  it("accepts a partial hubSections map", () => {
    const parsed = updateHorseHubSectionsSchema.parse({
      hubSections: { identification: { mode: "owner" } },
    });
    expect(parsed.hubSections.identification?.mode).toBe("owner");
  });

  it("rejects empty hubSections", () => {
    expect(() => updateHorseHubSectionsSchema.parse({ hubSections: {} })).toThrow();
  });
});
