import { describe, expect, it } from "vitest";

import { resolveHorsePublicContact } from "@/lib/horses/resolveHorsePublicContact.ts";

describe("resolveHorsePublicContact", () => {
  const ownerUser = {
    _id: "507f1f77bcf86cd799439011",
    personalDetails: {
      firstName: "Alice",
      lastName: "Owner",
      email: "alice@example.com",
      phoneNumber: "+351900000000",
    },
    preferences: {
      profileVisibility: "private",
    },
  } as Record<string, unknown>;

  it("hides owner contact for platform audience when owner is private", () => {
    expect(resolveHorsePublicContact({}, ownerUser, "platform")).toEqual({
      useOwnerContact: true,
      name: undefined,
      phone: undefined,
      email: undefined,
    });
  });

  it("shows owner contact for relationship audience when owner is private", () => {
    expect(resolveHorsePublicContact({}, ownerUser, "relationship")).toEqual({
      useOwnerContact: true,
      name: "Alice Owner",
      phone: "+351900000000",
      email: "alice@example.com",
    });
  });
});
