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

  it("returns delegate contact when useOwnerContact is false", () => {
    const horse = {
      contactDisplay: {
        useOwnerContact: false,
        name: "Stable Manager",
        phone: "+351911111111",
        email: "stable@example.com",
      },
    };

    expect(resolveHorsePublicContact(horse, ownerUser, "public")).toEqual({
      useOwnerContact: false,
      name: "Stable Manager",
      phone: "+351911111111",
      email: "stable@example.com",
    });
  });

  it("hides owner contact for platform audience when owner is private", () => {
    const horse = {
      contactDisplay: {
        useOwnerContact: true,
      },
    };

    expect(resolveHorsePublicContact(horse, ownerUser, "platform")).toEqual({
      useOwnerContact: true,
      name: undefined,
      phone: undefined,
      email: undefined,
    });
  });

  it("shows owner contact for relationship audience when owner is private", () => {
    const horse = {
      contactDisplay: {
        useOwnerContact: true,
      },
    };

    expect(resolveHorsePublicContact(horse, ownerUser, "relationship")).toEqual({
      useOwnerContact: true,
      name: "Alice Owner",
      phone: "+351900000000",
      email: "alice@example.com",
    });
  });
});

