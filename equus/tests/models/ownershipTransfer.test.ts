import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import OwnershipTransfer from "@/models/OwnershipTransfer.ts";
import User from "@/models/User.ts";

describe("OwnershipTransfer model", () => {
  it("defaults status to pending and sets requestedAt", async () => {
    const owner = await User.create({
      personalDetails: { email: "transfer-owner@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const receiver = await User.create({
      personalDetails: { email: "transfer-receiver@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      name: "Transfer Test Horse",
      breed: "TB",
      sex: "Gelding",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });

    const transfer = await OwnershipTransfer.create({
      entityType: "horse",
      entityId: horse._id,
      transferKind: "transfer_main",
      initiatorUserId: owner._id,
      receiverUserId: receiver._id,
      historicalReference: { entityName: "Transfer Test Horse" },
    });

    expect(transfer.status).toBe("pending");
    expect(transfer.requestedAt).toBeInstanceOf(Date);
    expect(transfer.transferKind).toBe("transfer_main");
    expect(String(transfer.entityId)).toBe(String(horse._id));
  });

  it("stores remove_co_owner with targetCoOwnerUserId", async () => {
    const owner = await User.create({
      personalDetails: { email: "co-owner-main@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const coOwner = await User.create({
      personalDetails: { email: "co-owner-partner@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      name: "Co-owner Horse",
      breed: "WB",
      sex: "Mare",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      coOwners: [{ userId: coOwner._id, ownershipPercentage: 40 }],
    });

    const transfer = await OwnershipTransfer.create({
      entityType: "horse",
      entityId: horse._id,
      transferKind: "remove_co_owner",
      initiatorUserId: owner._id,
      receiverUserId: coOwner._id,
      targetCoOwnerUserId: coOwner._id,
    });

    expect(transfer.transferKind).toBe("remove_co_owner");
    expect(String(transfer.targetCoOwnerUserId)).toBe(String(coOwner._id));
  });

  it("stores email invite fields for transfer_main", async () => {
    const owner = await User.create({
      personalDetails: { email: "invite-main@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      name: "Invite Horse",
      breed: "TB",
      sex: "Gelding",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });

    const transfer = await OwnershipTransfer.create({
      entityType: "horse",
      entityId: horse._id,
      transferKind: "transfer_main",
      initiatorUserId: owner._id,
      invitedEmail: "buyer@example.com",
      invitedName: "Future Buyer",
      referralReference: "ref-transfer-1",
    });

    expect(transfer.invitedEmail).toBe("buyer@example.com");
    expect(transfer.referralReference).toBe("ref-transfer-1");
    expect(transfer.receiverUserId).toBeUndefined();
  });

  it("rejects invalid transferKind", async () => {
    const owner = await User.create({
      personalDetails: { email: "invalid-kind@example.com", password: "hash" },
      authProvider: "credentials",
    });
    const horse = await Horse.create({
      name: "Invalid Kind Horse",
      breed: "TB",
      sex: "Gelding",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });

    await expect(
      OwnershipTransfer.create({
        entityType: "horse",
        entityId: horse._id,
        transferKind: "add_co_owner",
        initiatorUserId: owner._id,
      }),
    ).rejects.toThrow();
  });

  it("rejects invalid entityType", async () => {
    const owner = await User.create({
      personalDetails: { email: "invalid-entity@example.com", password: "hash" },
      authProvider: "credentials",
    });

    await expect(
      OwnershipTransfer.create({
        entityType: "trainer",
        entityId: owner._id,
        transferKind: "transfer_main",
        initiatorUserId: owner._id,
        receiverUserId: owner._id,
      }),
    ).rejects.toThrow();
  });
});
