import { describe, expect, it } from "vitest";

import type { OwnerHorseSummary } from "@/lib/services/horseService.ts";
import {
  buildProfileSavePatches,
  emptyProfileFormValues,
  toProfileFormValues,
} from "@/lib/utils/horseProfilePatch.ts";

function sampleHorse(overrides: Partial<OwnerHorseSummary> = {}): OwnerHorseSummary {
  return {
    id: "507f1f77bcf86cd799439011",
    name: "Comet",
    breed: "Lusitano",
    sex: "Gelding",
    countryOfBirth: "US",
    color: "Bay",
    heightHands: 16,
    dateOfBirth: "2018-06-01T00:00:00.000Z",
    registeredName: "Comet Star",
    registryId: "REG-1",
    description: "Friendly",
    disciplines: ["Dressage"],
    pedigree: { sireName: "Sire", damName: "Dam", bloodlineNotes: "Notes" },
    ...overrides,
  };
}

describe("toProfileFormValues", () => {
  it("maps horse view fields into the profile form", () => {
    const values = toProfileFormValues(sampleHorse());

    expect(values.name).toBe("Comet");
    expect(values.registryId).toBe("REG-1");
    expect(values.disciplines).toEqual(["Dressage"]);
    expect(values.pedigree.bloodlineNotes).toBe("Notes");
  });
});

describe("buildProfileSavePatches", () => {
  it("includes only dirty fields in the horse patch", () => {
    const values = {
      ...emptyProfileFormValues(),
      name: "Comet II",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
      description: "Updated bio",
      pedigree: { sireName: "", damName: "", bloodlineNotes: "New notes" },
    };

    const { horsePatch } = buildProfileSavePatches(values, {
      name: true,
      description: true,
      pedigree: { bloodlineNotes: true },
    });

    expect(horsePatch).toEqual({
      name: "Comet II",
      description: "Updated bio",
      pedigree: { bloodlineNotes: "New notes" },
    });
    expect(horsePatch).not.toHaveProperty("saleStatus");
    expect(horsePatch).not.toHaveProperty("askingPrice");
  });

  it("returns empty patch when nothing is dirty", () => {
    const values = toProfileFormValues(sampleHorse());
    const { horsePatch } = buildProfileSavePatches(values, {});

    expect(horsePatch).toEqual({});
  });
});
