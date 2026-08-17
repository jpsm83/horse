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
  const responsibleId = new mongoose.Types.ObjectId().toString();
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

  const hostProfileWithResponsible = {
    mainOwnerUserId: new mongoose.Types.ObjectId(mainOwnerId),
    coOwners: [],
    responsibles: [{ userId: new mongoose.Types.ObjectId(responsibleId) }],
  };

  it("ownedByUserQuery matches main owner, co-owner, and responsible person", () => {
    const query = ownedByUserQuery(mainOwnerId);
    expect(query.$or).toEqual(
      expect.arrayContaining([
        { mainOwnerUserId: new mongoose.Types.ObjectId(mainOwnerId) },
        { "coOwners.userId": new mongoose.Types.ObjectId(mainOwnerId) },
      ]),
    );

    const coQuery = ownedByUserQuery(coOwnerId);
    expect(coQuery.$or).toHaveLength(3);

    const responsibleQuery = ownedByUserQuery(responsibleId);
    expect(responsibleQuery.$or).toEqual(
      expect.arrayContaining([
        { "responsibles.userId": new mongoose.Types.ObjectId(responsibleId) },
      ]),
    );
  });

  it("userOwnsEntity returns true for main owner, co-owner, and responsible person", () => {
    expect(userOwnsEntity(mainOwnerId, hostProfile)).toBe(true);
    expect(userOwnsEntity(coOwnerId, hostProfile)).toBe(true);
    expect(userOwnsEntity(otherId, hostProfile)).toBe(false);
    expect(userOwnsEntity(responsibleId, hostProfileWithResponsible)).toBe(true);
  });

  it("resolveMainOwnerUserId reads mainOwnerUserId for all business host types", () => {
    expect(resolveMainOwnerUserId("stable", hostProfile)).toBe(mainOwnerId);
    expect(resolveMainOwnerUserId("breeder", hostProfile)).toBe(mainOwnerId);
    expect(resolveMainOwnerUserId("transport", hostProfile)).toBe(mainOwnerId);
  });
});
