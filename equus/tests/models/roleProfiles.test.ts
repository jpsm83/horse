import { describe, expect, it } from "vitest";
import User from "@/models/User.ts";
import Rider from "@/models/Rider.ts";
import Groom from "@/models/Groom.ts";
import Farrier from "@/models/Farrier.ts";
import Stable from "@/models/Stable.ts";
import RidingClub from "@/models/RidingClub.ts";
import Transport from "@/models/Transport.ts";

describe("User model role profile id fields", () => {
  it("defines position-linked profile id paths", () => {
    expect(User.schema.path("riderProfileId")).toBeDefined();
    expect(User.schema.path("groomProfileId")).toBeDefined();
    expect(User.schema.path("farrierProfileId")).toBeDefined();
  });
});

describe("Position-linked role profile models", () => {
  it("creates Rider linked to userId", async () => {
    const user = await User.create({
      personalDetails: { email: "rider@example.com", password: "hash" },
    });

    const rider = await Rider.create({
      userId: user._id,
      displayName: "Alex Rider",
      email: "rider@example.com",
    });

    expect(String(rider.userId)).toBe(String(user._id));
    expect(rider.displayName).toBe("Alex Rider");
  });

  it("creates Groom and Farrier profiles", async () => {
    const user = await User.create({
      personalDetails: { email: "multi-role@example.com", password: "hash" },
    });

    const groom = await Groom.create({
      userId: user._id,
      displayName: "Carla Groom",
      email: "multi-role@example.com",
    });
    const farrier = await Farrier.create({
      userId: user._id,
      displayName: "Frank Farrier",
      email: "multi-role@example.com",
    });

    expect(groom.displayName).toBe("Carla Groom");
    expect(farrier.displayName).toBe("Frank Farrier");
  });
});

describe("Entity-owned host profile models", () => {
  it("defines mainOwnerUserId and coOwners on Stable and RidingClub", () => {
    expect(Stable.schema.path("mainOwnerUserId")).toBeDefined();
    expect(Stable.schema.path("coOwners")).toBeDefined();
    expect(Stable.schema.path("userId")).toBeUndefined();

    expect(RidingClub.schema.path("mainOwnerUserId")).toBeDefined();
    expect(RidingClub.schema.path("coOwners")).toBeDefined();
  });

  it("defines mainOwnerUserId only on Transport", () => {
    expect(Transport.schema.path("mainOwnerUserId")).toBeDefined();
    expect(Transport.schema.path("coOwners")).toBeUndefined();
    expect(Transport.schema.path("userId")).toBeUndefined();
  });
});
