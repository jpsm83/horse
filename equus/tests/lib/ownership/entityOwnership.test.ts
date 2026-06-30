import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import {
  ownedByUserQuery,
  resolveMainOwnerUserId,
  userOwnsEntity,
} from "@/lib/ownership/entityOwnership.ts";

describe("entityOwnership", () => {
  const mainOwnerId = new mongoose.Types.ObjectId().toString();
  const coOwnerId = new mongoose.Types.ObjectId().toString();
  const otherId = new mongoose.Types.ObjectId().toString();

  const hostProfile = {
    mainOwnerUserId: new mongoose.Types.ObjectId(mainOwnerId),
    coOwners: [
      {
        userId: new mongoose.Types.ObjectId(coOwnerId),
        ownershipPercentage: 40,
      },
    ],
  };

  it("ownedByUserQuery matches main owner and co-owner", () => {
    const query = ownedByUserQuery(mainOwnerId);
    expect(query.$or).toEqual(
      expect.arrayContaining([
        { mainOwnerUserId: new mongoose.Types.ObjectId(mainOwnerId) },
        { "coOwners.userId": new mongoose.Types.ObjectId(mainOwnerId) },
      ]),
    );

    const coQuery = ownedByUserQuery(coOwnerId);
    expect(coQuery.$or).toHaveLength(2);
  });

  it("userOwnsEntity returns true for main owner and co-owner", () => {
    expect(userOwnsEntity(mainOwnerId, hostProfile)).toBe(true);
    expect(userOwnsEntity(coOwnerId, hostProfile)).toBe(true);
    expect(userOwnsEntity(otherId, hostProfile)).toBe(false);
  });

  it("resolveMainOwnerUserId reads mainOwnerUserId for host types and userId for breeder", () => {
    expect(resolveMainOwnerUserId("stable", hostProfile)).toBe(mainOwnerId);
    expect(resolveMainOwnerUserId("transport", hostProfile)).toBe(mainOwnerId);

    const breederProfile = { userId: new mongoose.Types.ObjectId(otherId) };
    expect(resolveMainOwnerUserId("breeder", breederProfile)).toBe(otherId);
  });
});
