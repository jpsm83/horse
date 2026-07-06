/**
 * UA-16 — `remove_co_owner` syndicate wind-down (main initiates; target accepts).
 */

import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import Stable from "@/models/Stable.ts";
import * as userService from "@/lib/services/userService.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";
import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { createTestStable } from "@/tests/helpers/businessRoleFixtures.ts";

async function createUser(email: string, firstName = "Test") {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName,
  });
}

async function createHorse(
  ownerId: string,
  name: string,
  coOwners: Array<{ userId: string; ownershipPercentage: number }>,
) {
  return Horse.create({
    name,
    breed: "Thoroughbred",
    sex: "Mare",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
    coOwners,
  });
}

describe("ownershipTransferService.remove_co_owner", () => {
  it("pulls target from coOwners on accept while main owner stays", async () => {
    const main = await createUser("rco-main@example.com");
    const partner = await createUser("rco-partner@example.com");
    const other = await createUser("rco-other@example.com");
    const horse = await createHorse(String(main._id), "Syndicate Horse", [
      { userId: String(partner._id), ownershipPercentage: 30 },
      { userId: String(other._id), ownershipPercentage: 20 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: String(partner._id),
      },
    );

    expect(pending.receiverUserId).toBe(String(partner._id));
    expect(pending.targetCoOwnerUserId).toBe(String(partner._id));

    const accepted = await ownershipTransferService.acceptOwnershipTransfer(
      String(partner._id),
      pending.id,
    );

    expect(accepted.status).toBe("accepted");

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(main._id));
    const remainingIds = (reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId));
    expect(remainingIds).toEqual([String(other._id)]);
    expect(userOwnsEntity(String(partner._id), reloaded as Record<string, unknown>)).toBe(
      false,
    );
    expect(userOwnsEntity(String(other._id), reloaded as Record<string, unknown>)).toBe(
      true,
    );
    expect(userOwnsEntity(String(main._id), reloaded as Record<string, unknown>)).toBe(
      true,
    );
  });

  it("keeps co-owner access while transfer is pending", async () => {
    const main = await createUser("rco-pending-main@example.com");
    const partner = await createUser("rco-pending-partner@example.com");
    const horse = await createHorse(String(main._id), "Pending Remove Horse", [
      { userId: String(partner._id), ownershipPercentage: 35 },
    ]);

    await ownershipTransferService.createOwnershipTransfer(String(main._id), {
      entityType: "horse",
      entityId: String(horse._id),
      transferKind: "remove_co_owner",
      targetCoOwnerUserId: String(partner._id),
    });

    const reloaded = await Horse.findById(horse._id).lean();
    expect(userOwnsEntity(String(partner._id), reloaded as Record<string, unknown>)).toBe(
      true,
    );
  });

  it("rejects create when target is not in coOwners", async () => {
    const main = await createUser("rco-not-co@example.com");
    const stranger = await createUser("rco-stranger@example.com");
    const horse = await Horse.create({
      name: "Solo Horse",
      breed: "TB",
      sex: "Gelding",
      mainOwnerUserId: main._id,
      createdByUserId: main._id,
    });

    await expect(
      ownershipTransferService.createOwnershipTransfer(String(main._id), {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: String(stranger._id),
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects create from non-main owner", async () => {
    const main = await createUser("rco-auth-main@example.com");
    const partner = await createUser("rco-auth-partner@example.com");
    const horse = await createHorse(String(main._id), "Auth Remove Horse", [
      { userId: String(partner._id), ownershipPercentage: 25 },
    ]);

    await expect(
      ownershipTransferService.createOwnershipTransfer(String(partner._id), {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: String(partner._id),
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("decline leaves coOwners unchanged", async () => {
    const main = await createUser("rco-decline-main@example.com");
    const partner = await createUser("rco-decline-partner@example.com");
    const horse = await createHorse(String(main._id), "Decline Remove Horse", [
      { userId: String(partner._id), ownershipPercentage: 40 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: String(partner._id),
      },
    );

    await ownershipTransferService.declineOwnershipTransfer(
      String(partner._id),
      pending.id,
    );

    const reloaded = await Horse.findById(horse._id).lean();
    expect((reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId))).toEqual([
      String(partner._id),
    ]);
  });

  it("cancel leaves coOwners unchanged", async () => {
    const main = await createUser("rco-cancel-main@example.com");
    const partner = await createUser("rco-cancel-partner@example.com");
    const horse = await createHorse(String(main._id), "Cancel Remove Horse", [
      { userId: String(partner._id), ownershipPercentage: 40 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: String(partner._id),
      },
    );

    await ownershipTransferService.cancelOwnershipTransfer(String(main._id), pending.id);

    const reloaded = await Horse.findById(horse._id).lean();
    expect((reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId))).toEqual([
      String(partner._id),
    ]);
  });

  it("rejects accept from a user who is not the target co-owner", async () => {
    const main = await createUser("rco-wrong-main@example.com");
    const partner = await createUser("rco-wrong-partner@example.com");
    const other = await createUser("rco-wrong-other@example.com");
    const horse = await createHorse(String(main._id), "Wrong Receiver Remove", [
      { userId: String(partner._id), ownershipPercentage: 30 },
      { userId: String(other._id), ownershipPercentage: 15 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: String(partner._id),
      },
    );

    await expect(
      ownershipTransferService.acceptOwnershipTransfer(String(other._id), pending.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("rejects accept when target was already removed from the entity", async () => {
    const main = await createUser("rco-gone-main@example.com");
    const partner = await createUser("rco-gone-partner@example.com");
    const horse = await createHorse(String(main._id), "Gone Co-owner Horse", [
      { userId: String(partner._id), ownershipPercentage: 30 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: String(partner._id),
      },
    );

    await Horse.findByIdAndUpdate(horse._id, {
      $pull: { coOwners: { userId: partner._id } },
    });

    await expect(
      ownershipTransferService.acceptOwnershipTransfer(String(partner._id), pending.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
  });

  it("applies remove_co_owner on stable entities", async () => {
    const main = await createUser("rco-stable-main@example.com");
    const partner = await createUser("rco-stable-partner@example.com");
    const stable = await createTestStable(main._id, {
      tradeName: "Partner Stable",
      coOwners: [{ userId: partner._id, ownershipPercentage: 50 }],
    });

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "stable",
        entityId: String(stable._id),
        transferKind: "remove_co_owner",
        targetCoOwnerUserId: String(partner._id),
      },
    );

    await ownershipTransferService.acceptOwnershipTransfer(String(partner._id), pending.id);

    const reloaded = await Stable.findById(stable._id).lean();
    expect(reloaded?.coOwners ?? []).toHaveLength(0);
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(main._id));
  });
});
