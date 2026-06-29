import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import * as userService from "@/lib/services/userService.ts";

describe("Horse model discovery defaults", () => {
  it("defaults profileVisibility to public and contactDisplay to owner contact", async () => {
    const owner = await userService.createCredentialsUser({
      email: "horse-owner@example.com",
      password: "TestPass1!",
    });

    const horse = await Horse.create({
      name: "Thunder",
      breed: "Lusitano",
      sex: "Gelding",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });

    expect(horse.profileVisibility).toBe("public");
    expect(horse.contactDisplay?.useOwnerContact).toBe(true);
    expect(horse.contactDisplay?.name).toBeUndefined();
  });

  it("persists custom contact display when set", async () => {
    const owner = await User.create({
      personalDetails: { email: "custom-contact@example.com", password: "hash" },
      authProvider: "credentials",
    });

    const horse = await Horse.create({
      name: "Star",
      breed: "Arabian",
      sex: "Mare",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      contactDisplay: {
        useOwnerContact: false,
        name: "Stable Manager",
        phone: "+351900000000",
        email: "stable@example.com",
      },
    });

    expect(horse.contactDisplay?.useOwnerContact).toBe(false);
    expect(horse.contactDisplay?.name).toBe("Stable Manager");
    expect(horse.contactDisplay?.email).toBe("stable@example.com");
  });
});

describe("User model role fields", () => {
  it("does not define ownerPreferences or activeAccountContext paths", () => {
    expect(User.schema.path("ownerPreferences")).toBeUndefined();
    expect(User.schema.path("activeAccountContext")).toBeUndefined();
  });

  it("defines position-linked profile id paths", () => {
    expect(User.schema.path("riderProfileId")).toBeDefined();
    expect(User.schema.path("groomProfileId")).toBeDefined();
    expect(User.schema.path("farrierProfileId")).toBeDefined();
  });
});
