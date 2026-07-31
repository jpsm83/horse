import { describe, expect, it } from "vitest";

import {
  createHorseFormSchemas,
  emptyCreateHorseFormValues,
} from "@/lib/validations/horseForms.ts";

const messages = {
  required: "Required",
  invalidDate: "Invalid date",
  invalidEnum: "Invalid option",
  invalidNumber: "Invalid number",
};

const { createHorseFormSchema } = createHorseFormSchemas(messages);

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
