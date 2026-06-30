import { describe, expect, it } from "vitest";

import {
  createHorseFormSchemas,
  emptyCreateHorseFormValues,
} from "@/lib/validations/horseForms.ts";

const messages = {
  required: "Required",
  invalidDate: "Invalid date",
  invalidEnum: "Invalid option",
  contactNameRequired: "Contact name required",
  contactPhoneRequired: "Contact phone required",
  contactEmailRequired: "Contact email required",
  contactEmailInvalid: "Invalid email",
};

const { createHorseFormSchema } = createHorseFormSchemas(messages);

describe("createHorseFormSchema", () => {
  it("accepts minimal valid input", () => {
    const result = createHorseFormSchema.safeParse({
      ...emptyCreateHorseFormValues,
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const result = createHorseFormSchema.safeParse(emptyCreateHorseFormValues);

    expect(result.success).toBe(false);
  });

  it("requires delegate contact when not using owner contact", () => {
    const result = createHorseFormSchema.safeParse({
      ...emptyCreateHorseFormValues,
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      contactDisplay: {
        useOwnerContact: "false",
        name: "",
        phone: "",
        email: "",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("contactDisplay.name");
      expect(paths).toContain("contactDisplay.phone");
      expect(paths).toContain("contactDisplay.email");
    }
  });

  it("accepts delegate contact when not using owner contact", () => {
    const result = createHorseFormSchema.safeParse({
      ...emptyCreateHorseFormValues,
      name: "Comet",
      breed: "Lusitano",
      sex: "Gelding",
      contactDisplay: {
        useOwnerContact: "false",
        name: "Manager",
        phone: "+351911111111",
        email: "manager@example.com",
      },
    });

    expect(result.success).toBe(true);
  });
});
