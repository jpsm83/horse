import { describe, expect, it } from "vitest";
import {
  isProfileComplete,
  refreshTokenPayloadVersionMatchesDb,
} from "@/lib/auth/session.ts";
import {
  isValidConfirmEmailTokenInput,
  CONFIRM_EMAIL_CONSUMPTION_ERROR_MESSAGE,
} from "@/lib/auth/confirmEmail.ts";

const completePersonalDetails = {
  username: "jane",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Doe",
  idType: "Passport",
  idNumber: "P1",
  nationality: "Portuguese",
  gender: "Woman",
  birthDate: new Date("1990-01-01"),
  phoneNumber: "+351912345678",
  imageUrl: "https://example.com/avatar.png",
  bio: "Horse owner",
  preferredLanguage: "en",
  address: {
    country: "Portugal",
    state: "Lisbon",
    city: "Lisbon",
    street: "Main",
    buildingNumber: "1",
    postCode: "1000",
    coordinates: [-9.1393, 38.7223],
  },
};

describe("session helpers", () => {
  it("isProfileComplete is false when profile fields are incomplete", () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(isProfileComplete({ email: "a@b.com" })).toBe(false);
    expect(
      isProfileComplete({
        ...completePersonalDetails,
        bio: "",
      }),
    ).toBe(false);
    expect(
      isProfileComplete({
        ...completePersonalDetails,
        address: {
          ...(completePersonalDetails.address as Record<string, unknown>),
          coordinates: undefined,
        },
      }),
    ).toBe(false);
    expect(
      isProfileComplete({
        address: { country: "Portugal" },
      }),
    ).toBe(false);
  });

  it("isProfileComplete is true when all personalDetails and address fields are set", () => {
    expect(isProfileComplete(completePersonalDetails)).toBe(true);
  });

  it("isProfileComplete is true without optional address fields", () => {
    expect(
      isProfileComplete({
        ...completePersonalDetails,
        address: {
          ...(completePersonalDetails.address as Record<string, unknown>),
        },
      }),
    ).toBe(true);
  });

  it("refreshTokenPayloadVersionMatchesDb treats missing token version as 0", () => {
    expect(refreshTokenPayloadVersionMatchesDb(undefined, 0)).toBe(true);
    expect(refreshTokenPayloadVersionMatchesDb(undefined, 1)).toBe(false);
    expect(refreshTokenPayloadVersionMatchesDb(1, 1)).toBe(true);
  });
});

describe("confirmEmail validation", () => {
  it("isValidConfirmEmailTokenInput rejects empty and non-strings", () => {
    expect(isValidConfirmEmailTokenInput(undefined)).toBe(false);
    expect(isValidConfirmEmailTokenInput("")).toBe(false);
    expect(isValidConfirmEmailTokenInput("   ")).toBe(false);
  });

  it("isValidConfirmEmailTokenInput accepts non-whitespace content", () => {
    expect(isValidConfirmEmailTokenInput("abc")).toBe(true);
  });

  it("uses a single consumption error message", () => {
    expect(CONFIRM_EMAIL_CONSUMPTION_ERROR_MESSAGE).toContain("invalid or has expired");
  });
});
