import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import User from "@/models/User.ts";
import * as userService from "@/lib/services/userService.ts";

describe("Horse model discovery defaults", () => {
  it("defaults profileVisibility to public", async () => {
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
    expect(Horse.schema.path("contactDisplay")).toBeUndefined();
    expect(Horse.schema.path("ageYears")).toBeUndefined();
    expect(Horse.schema.path("marksDescription")).toBeUndefined();
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
