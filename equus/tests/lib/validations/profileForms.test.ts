import { describe, expect, it } from "vitest";
import {
  createProfileFormSchemas,
  emptyProfileFormValues,
} from "@/lib/validations/profileForms.ts";

const messages = {
  fieldRequired: "Required",
  invalidDate: "Invalid date",
  invalidEnum: "Invalid option",
  invalidCoordinates: "Invalid coordinates",
  addressFieldRequired: "Address field required",
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

  it("rejects invalid birth date", () => {
    expect(() =>
      profileFormSchema.parse({
        ...emptyProfileFormValues,
        birthDate: "not-a-date",
      }),
    ).toThrow();
  });

  it("validates address when any address field is provided", () => {
    expect(() =>
      profileFormSchema.parse({
        ...emptyProfileFormValues,
        address: {
          ...emptyProfileFormValues.address,
          country: "PT",
        },
      }),
    ).toThrow();
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

  it("accepts a complete address with coordinates", () => {
    const parsed = profileFormSchema.parse({
      ...emptyProfileFormValues,
      address: {
        country: "PT",
        state: "Lisbon",
        city: "Lisbon",
        street: "Main",
        buildingNumber: "1",
        doorNumber: "2A",
        complement: "",
        postCode: "1000",
        region: "",
        additionalDetails: "",
        longitude: "-9.1393",
        latitude: "38.7223",
      },
    });

    expect(parsed.address.country).toBe("PT");
    expect(parsed.address.longitude).toBe("-9.1393");
  });
});
