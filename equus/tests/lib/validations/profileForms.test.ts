import { describe, expect, it } from "vitest";
import {
  createProfileFormSchemas,
  emptyProfileFormValues,
} from "@/lib/validations/profileForms.ts";

const messages = {
  invalidDate: "Invalid date",
  invalidEnum: "Invalid option",
};

const { profileFormSchema } = createProfileFormSchemas(messages);

describe("profileFormSchema", () => {
  it("accepts an empty form for partial save", () => {
    expect(() => profileFormSchema.parse(emptyProfileFormValues)).not.toThrow();
  });

  it("trims and accepts valid profile fields", () => {
    const parsed = profileFormSchema.parse({
      ...emptyProfileFormValues,
      firstName: "  Jane  ",
      lastName: "Doe",
    });

    expect(parsed.firstName).toBe("Jane");
    expect(parsed.lastName).toBe("Doe");
  });

  it("rejects invalid enum values", () => {
    expect(() =>
      profileFormSchema.parse({
        ...emptyProfileFormValues,
        gender: "invalid",
      }),
    ).toThrow();
  });

  it("rejects invalid preferred language", () => {
    expect(() =>
      profileFormSchema.parse({
        ...emptyProfileFormValues,
        preferredLanguage: "fr",
      }),
    ).toThrow();
  });

  it("rejects invalid profile visibility", () => {
    expect(() =>
      profileFormSchema.parse({
        ...emptyProfileFormValues,
        profileVisibility: "friends_only",
      }),
    ).toThrow();
  });

  it("rejects invalid birth date", () => {
    expect(() =>
      profileFormSchema.parse({
        ...emptyProfileFormValues,
        birthDate: "not-a-date",
      }),
    ).toThrow();
  });

  it("accepts partial address fields on the client form", () => {
    const parsed = profileFormSchema.parse({
      ...emptyProfileFormValues,
      address: {
        ...emptyProfileFormValues.address,
        country: "PT",
      },
    });
    expect(parsed.address.country).toBe("PT");
  });

  it("rejects invalid country codes", () => {
    expect(() =>
      profileFormSchema.parse({
        ...emptyProfileFormValues,
        nationality: "Portugal",
      }),
    ).toThrow();
  });

  it("accepts valid ISO nationality", () => {
    const parsed = profileFormSchema.parse({
      ...emptyProfileFormValues,
      nationality: "pt",
    });
    expect(parsed.nationality).toBe("PT");
  });

  it("accepts a complete address without manual coordinate fields", () => {
    const parsed = profileFormSchema.parse({
      ...emptyProfileFormValues,
      address: {
        country: "PT",
        state: "Lisbon",
        city: "Lisbon",
        street: "Main",
        buildingNumber: "1",
        doorNumber: "",
        complement: "",
        postCode: "1000",
        region: "",
        additionalDetails: "",
      },
    });

    expect(parsed.address.country).toBe("PT");
    expect(parsed.address.street).toBe("Main");
  });
});
