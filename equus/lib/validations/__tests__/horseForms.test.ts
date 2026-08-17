import { describe, expect, it } from "vitest";

import {
  createHorseFormSchemas,
  emptyCreateHorseFormValues,
  profileFormSchemas,
} from "@/lib/validations/horseForms.ts";
import { emptyProfileFormValues } from "@/lib/utils/horseProfilePatch.ts";

const messages = {
  required: "Required",
  invalidDate: "Invalid date",
  invalidEnum: "Invalid option",
  invalidNumber: "Invalid number",
};

const { createHorseFormSchema } = createHorseFormSchemas(messages);
const { profileFormSchema } = profileFormSchemas(messages);

describe("createHorseFormSchema", () => {
  it("accepts minimal valid input", () => {
    const result = createHorseFormSchema.safeParse({
      ...emptyCreateHorseFormValues,
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = createHorseFormSchema.safeParse(emptyCreateHorseFormValues);

    expect(result.success).toBe(false);
  });

  it("accepts discovery visibility without contact display", () => {
    const result = createHorseFormSchema.safeParse({
      ...emptyCreateHorseFormValues,
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
      profileVisibility: "relationship",
    });

    expect(result.success).toBe(true);
  });

  it("rejects heightHands above the server max of 30", () => {
    const result = createHorseFormSchema.safeParse({
      ...emptyCreateHorseFormValues,
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
      heightHands: "123",
    });

    expect(result.success).toBe(false);
  });

  it("accepts heightHands within range", () => {
    const result = createHorseFormSchema.safeParse({
      ...emptyCreateHorseFormValues,
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
      heightHands: "16",
    });

    expect(result.success).toBe(true);
  });
});

describe("profileFormSchema", () => {
  it("accepts identity, identification, about, and pedigree fields", () => {
    const result = profileFormSchema.safeParse({
      ...emptyProfileFormValues(),
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
      registryId: "REG-1",
      registeredName: "Comet Star",
      description: "Friendly gelding",
      pedigree: { sireName: "", damName: "", bloodlineNotes: "Line notes" },
    });

    expect(result.success).toBe(true);
  });

  it("does not include commercial sale fields", () => {
    const result = profileFormSchema.safeParse({
      ...emptyProfileFormValues(),
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "US",
      registryId: "REG-1",
      saleStatus: "for_sale",
      askingPrice: "50000",
      estimatedValue: "60000",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("saleStatus");
      expect(result.data).not.toHaveProperty("askingPrice");
      expect(result.data).not.toHaveProperty("estimatedValue");
    }
  });
});
