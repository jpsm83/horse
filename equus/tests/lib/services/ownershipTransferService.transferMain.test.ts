/**
 * UA-15 — `transfer_main` ownership handoff (sale / external transfer).
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
  coOwners: Array<{ userId: string; ownershipPercentage: number }> = [],
) {
  return Horse.create({
    name,
    breed: "Thoroughbred",
    sex: "Mare",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
    ...(coOwners.length > 0 ? { coOwners } : {}),
  });
}

describe("ownershipTransferService.transfer_main", () => {
  it("sets mainOwnerUserId on accept and former main loses owner access", async () => {
    const main = await createUser("tm-main@example.com");
    const buyer = await createUser("tm-buyer@example.com");
    const horse = await createHorse(String(main._id), "Handoff Horse");

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "transfer_main",
        receiverUserId: String(buyer._id),
      },
    );

    const accepted = await ownershipTransferService.acceptOwnershipTransfer(
      String(buyer._id),
      pending.id,
    );

    expect(accepted.status).toBe("accepted");
    expect(accepted.transferKind).toBe("transfer_main");

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(buyer._id));
    expect(String(reloaded?.createdByUserId)).toBe(String(main._id));
    expect(reloaded?.coOwners ?? []).toHaveLength(0);
    expect(String((reloaded?.registration as { payerUserId?: unknown })?.payerUserId)).toBe(
      String(buyer._id),
    );
    expect(userOwnsEntity(String(main._id), reloaded as Record<string, unknown>)).toBe(
      false,
    );
    expect(userOwnsEntity(String(buyer._id), reloaded as Record<string, unknown>)).toBe(
      true,
    );
  });

  it("rejects create when coOwners.length > 0", async () => {
    const main = await createUser("tm-co-main@example.com");
    const partner = await createUser("tm-co-partner@example.com");
    const buyer = await createUser("tm-co-buyer@example.com");
    const horse = await createHorse(String(main._id), "Shared Horse", [
      { userId: String(partner._id), ownershipPercentage: 30 },
    ]);

    await expect(
      ownershipTransferService.createOwnershipTransfer(String(main._id), {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "transfer_main",
        receiverUserId: String(buyer._id),
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });
  });

  it("rejects accept when co-owners are added after create", async () => {
    const main = await createUser("tm-late-co@example.com");
    const partner = await createUser("tm-late-partner@example.com");
    const buyer = await createUser("tm-late-buyer@example.com");
    const horse = await createHorse(String(main._id), "Late Co-owner Horse");

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "transfer_main",
        receiverUserId: String(buyer._id),
      },
    );

    await Horse.findByIdAndUpdate(horse._id, {
      $push: {
        coOwners: { userId: partner._id, ownershipPercentage: 25 },
      },
    });

    await expect(
      ownershipTransferService.acceptOwnershipTransfer(String(buyer._id), pending.id),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(main._id));
  });

  it("accepts via invitedEmail when buyer registers after invite", async () => {
    const main = await createUser("tm-invite-main@example.com");
    const horse = await createHorse(String(main._id), "Invite Horse");

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "transfer_main",
        invitedEmail: "tm-invite-buyer@example.com",
        invitedName: "Future Buyer",
      },
    );

    expect(pending.receiverUserId).toBeUndefined();
    expect(pending.invitedEmail).toBe("tm-invite-buyer@example.com");

    const buyer = await createUser("tm-invite-buyer@example.com");

    await ownershipTransferService.acceptOwnershipTransfer(String(buyer._id), pending.id);

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(buyer._id));
  });

  it("rejects accept from a user who is not the designated receiver", async () => {
    const main = await createUser("tm-wrong-main@example.com");
    const buyer = await createUser("tm-wrong-buyer@example.com");
    const stranger = await createUser("tm-stranger@example.com");
    const horse = await createHorse(String(main._id), "Wrong Receiver Horse");

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "transfer_main",
        receiverUserId: String(buyer._id),
      },
    );

    await expect(
      ownershipTransferService.acceptOwnershipTransfer(String(stranger._id), pending.id),
    ).rejects.toMatchObject({
      statusCode: 403,
      code: "FORBIDDEN",
    });
  });

  it("rejects transfer_main to self", async () => {
    const main = await createUser("tm-self@example.com");
    const horse = await createHorse(String(main._id), "Self Transfer Horse");

    await expect(
      ownershipTransferService.createOwnershipTransfer(String(main._id), {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "transfer_main",
        receiverUserId: String(main._id),
      }),
    ).rejects.toMatchObject({
      statusCode: 400,
      code: "VALIDATION_ERROR",
    });
  });

  it("applies transfer_main on stable entities", async () => {
    const main = await createUser("tm-stable-main@example.com");
    const buyer = await createUser("tm-stable-buyer@example.com");
    const stable = await createTestStable(main._id, { tradeName: "Sunrise Stable" });

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "stable",
        entityId: String(stable._id),
        transferKind: "transfer_main",
        receiverUserId: String(buyer._id),
      },
    );

    await ownershipTransferService.acceptOwnershipTransfer(String(buyer._id), pending.id);

    const reloaded = await Stable.findById(stable._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(buyer._id));
    expect(userOwnsEntity(String(main._id), reloaded as Record<string, unknown>)).toBe(
      false,
    );
  });
});
