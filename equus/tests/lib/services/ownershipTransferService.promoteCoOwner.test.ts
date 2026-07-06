/**
 * UA-17 — `promote_co_owner` partner takeover (main initiates; target co-owner accepts).
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

describe("ownershipTransferService.promote_co_owner", () => {
  it("swaps main owner, pulls promoted from coOwners, and keeps other co-owners", async () => {
    const main = await createUser("pco-main@example.com");
    const promoted = await createUser("pco-promoted@example.com");
    const other = await createUser("pco-other@example.com");
    const horse = await createHorse(String(main._id), "Takeover Horse", [
      { userId: String(promoted._id), ownershipPercentage: 40 },
      { userId: String(other._id), ownershipPercentage: 20 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(promoted._id),
      },
    );

    expect(pending.receiverUserId).toBe(String(promoted._id));

    const accepted = await ownershipTransferService.acceptOwnershipTransfer(
      String(promoted._id),
      pending.id,
    );

    expect(accepted.status).toBe("accepted");

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(promoted._id));
    expect(String(reloaded?.createdByUserId)).toBe(String(main._id));
    const remainingIds = (reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId));
    expect(remainingIds).toEqual([String(other._id)]);
    expect(remainingIds).not.toContain(String(promoted._id));
    expect(userOwnsEntity(String(main._id), reloaded as Record<string, unknown>)).toBe(
      false,
    );
    expect(userOwnsEntity(String(promoted._id), reloaded as Record<string, unknown>)).toBe(
      true,
    );
    expect(userOwnsEntity(String(other._id), reloaded as Record<string, unknown>)).toBe(
      true,
    );
  });

  it("leaves ownership unchanged while transfer is pending", async () => {
    const main = await createUser("pco-pending-main@example.com");
    const promoted = await createUser("pco-pending-promoted@example.com");
    const horse = await createHorse(String(main._id), "Pending Promote Horse", [
      { userId: String(promoted._id), ownershipPercentage: 50 },
    ]);

    await ownershipTransferService.createOwnershipTransfer(String(main._id), {
      entityType: "horse",
      entityId: String(horse._id),
      transferKind: "promote_co_owner",
      targetCoOwnerUserId: String(promoted._id),
    });

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(main._id));
    expect((reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId))).toEqual([
      String(promoted._id),
    ]);
  });

  it("rejects create when target is not in coOwners", async () => {
    const main = await createUser("pco-not-co@example.com");
    const stranger = await createUser("pco-stranger@example.com");
    const horse = await Horse.create({
      name: "Solo Promote Horse",
      breed: "TB",
      sex: "Gelding",
      mainOwnerUserId: main._id,
      createdByUserId: main._id,
    });

    await expect(
      ownershipTransferService.createOwnershipTransfer(String(main._id), {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(stranger._id),
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("rejects create from non-main owner", async () => {
    const main = await createUser("pco-auth-main@example.com");
    const promoted = await createUser("pco-auth-promoted@example.com");
    const horse = await createHorse(String(main._id), "Auth Promote Horse", [
      { userId: String(promoted._id), ownershipPercentage: 35 },
    ]);

    await expect(
      ownershipTransferService.createOwnershipTransfer(String(promoted._id), {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(promoted._id),
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("decline leaves main and coOwners unchanged", async () => {
    const main = await createUser("pco-decline-main@example.com");
    const promoted = await createUser("pco-decline-promoted@example.com");
    const other = await createUser("pco-decline-other@example.com");
    const horse = await createHorse(String(main._id), "Decline Promote Horse", [
      { userId: String(promoted._id), ownershipPercentage: 40 },
      { userId: String(other._id), ownershipPercentage: 15 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(promoted._id),
      },
    );

    await ownershipTransferService.declineOwnershipTransfer(
      String(promoted._id),
      pending.id,
    );

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(main._id));
    expect((reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId))).toEqual([
      String(promoted._id),
      String(other._id),
    ]);
  });

  it("cancel leaves main and coOwners unchanged", async () => {
    const main = await createUser("pco-cancel-main@example.com");
    const promoted = await createUser("pco-cancel-promoted@example.com");
    const horse = await createHorse(String(main._id), "Cancel Promote Horse", [
      { userId: String(promoted._id), ownershipPercentage: 45 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(promoted._id),
      },
    );

    await ownershipTransferService.cancelOwnershipTransfer(String(main._id), pending.id);

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(main._id));
    expect((reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId))).toEqual([
      String(promoted._id),
    ]);
  });

  it("rejects accept from a user who is not the target co-owner", async () => {
    const main = await createUser("pco-wrong-main@example.com");
    const promoted = await createUser("pco-wrong-promoted@example.com");
    const other = await createUser("pco-wrong-other@example.com");
    const horse = await createHorse(String(main._id), "Wrong Promote Receiver", [
      { userId: String(promoted._id), ownershipPercentage: 40 },
      { userId: String(other._id), ownershipPercentage: 20 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(promoted._id),
      },
    );

    await expect(
      ownershipTransferService.acceptOwnershipTransfer(String(other._id), pending.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("rejects accept when promoted user is no longer a co-owner", async () => {
    const main = await createUser("pco-gone-main@example.com");
    const promoted = await createUser("pco-gone-promoted@example.com");
    const horse = await createHorse(String(main._id), "Gone Promote Horse", [
      { userId: String(promoted._id), ownershipPercentage: 30 },
    ]);

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(promoted._id),
      },
    );

    await Horse.findByIdAndUpdate(horse._id, {
      $pull: { coOwners: { userId: promoted._id } },
    });

    await expect(
      ownershipTransferService.acceptOwnershipTransfer(String(promoted._id), pending.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
  });

  it("applies promote_co_owner on stable entities", async () => {
    const main = await createUser("pco-stable-main@example.com");
    const promoted = await createUser("pco-stable-promoted@example.com");
    const other = await createUser("pco-stable-other@example.com");
    const stable = await createTestStable(main._id, {
      tradeName: "Promote Stable",
      coOwners: [
        { userId: promoted._id, ownershipPercentage: 40 },
        { userId: other._id, ownershipPercentage: 20 },
      ],
    });

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "stable",
        entityId: String(stable._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(promoted._id),
      },
    );

    await ownershipTransferService.acceptOwnershipTransfer(String(promoted._id), pending.id);

    const reloaded = await Stable.findById(stable._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(promoted._id));
    expect((reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId))).toEqual([
      String(other._id),
    ]);
  });
});
