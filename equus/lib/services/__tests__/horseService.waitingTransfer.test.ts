import { describe, expect, it } from "vitest";

import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import OwnershipTransfer from "@/models/OwnershipTransfer.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { createTestStable } from "@/models/__tests__/helpers/businessRoleFixtures.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Stable",
  });
}

const baseHorseInput = {
  name: "Boarded Horse",
  breed: "Thoroughbred" as const,
  sex: "Mare" as const,
  countryOfBirth: "US",
};

describe("horseService.createHorse waitingTransfer", () => {
  it("stable main owner creates with waitingTransfer → flagged + accepted relationship + pending transfer_main", async () => {
    const stableOwner = await createUser("wt-stable-owner@example.com");
    const stable = await createTestStable(stableOwner._id);

    const horse = await horseService.createHorse(String(stableOwner._id), {
      ...baseHorseInput,
      waitingTransfer: {
        invitedOwnerEmail: "real-owner@example.com",
        hostStableId: String(stable._id),
      },
    });

    expect(horse.waitingTransfer?.active).toBe(true);
    expect(horse.waitingTransfer?.invitedOwnerEmail).toBe("real-owner@example.com");
    expect(String(horse.waitingTransfer?.hostStableId)).toBe(String(stable._id));

    const relationship = await Relationship.findOne({
      horseId: horse._id,
      receiverAccountId: stable._id,
      relationshipType: "stable",
    }).lean();
    expect(relationship?.status).toBe("accepted");

    const transfer = await OwnershipTransfer.findOne({
      entityId: horse._id,
      transferKind: "transfer_main",
      status: "pending",
    }).lean();
    expect(transfer?.invitedEmail).toBe("real-owner@example.com");
  });

  it("creates a normal horse when waitingTransfer block is omitted", async () => {
    const owner = await createUser("wt-normal-owner@example.com");

    const horse = await horseService.createHorse(String(owner._id), baseHorseInput);

    expect(horse.waitingTransfer).toBeUndefined();
    const count = await Relationship.countDocuments({ horseId: horse._id });
    expect(count).toBe(0);
  });

  it("rejects waitingTransfer when actor does not own the stable", async () => {
    const stableOwner = await createUser("wt-stable-real@example.com");
    const outsider = await createUser("wt-outsider@example.com");
    const stable = await createTestStable(stableOwner._id);

    await expect(
      horseService.createHorse(String(outsider._id), {
        ...baseHorseInput,
        waitingTransfer: {
          invitedOwnerEmail: "real-owner@example.com",
          hostStableId: String(stable._id),
        },
      }),
    ).rejects.toBeInstanceOf(ApiError);

    const horses = await Horse.find({ "waitingTransfer.hostStableId": stable._id });
    expect(horses).toHaveLength(0);
  });

  it("rejects waitingTransfer when invited email equals actor email", async () => {
    const stableOwner = await createUser("wt-self-invite@example.com");
    const stable = await createTestStable(stableOwner._id);

    await expect(
      horseService.createHorse(String(stableOwner._id), {
        ...baseHorseInput,
        waitingTransfer: {
          invitedOwnerEmail: "wt-self-invite@example.com",
          hostStableId: String(stable._id),
        },
      }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});
