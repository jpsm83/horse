import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import * as userService from "@/lib/services/userService.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";
import { userOwnsEntity } from "@/lib/ownership/entityOwnership.ts";
import { ApiError } from "@/lib/api/errors.ts";

async function createUser(email: string, firstName = "Test") {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName,
  });
}

async function createHorse(ownerId: string, name: string, coOwners: Array<{ userId: string; ownershipPercentage: number }> = []) {
  return Horse.create({
    name,
    breed: "Thoroughbred",
    sex: "Mare",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
    registration: {
      payerUserId: ownerId,
    },
    ...(coOwners.length > 0 ? { coOwners } : {}),
  });
}

describe("ownershipTransferService", () => {
  it("decline leaves entity unchanged", async () => {
    const main = await createUser("ot-decline-main@example.com");
    const buyer = await createUser("ot-decline-buyer@example.com");
    const horse = await createHorse(String(main._id), "Decline Horse");

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "transfer_main",
        receiverUserId: String(buyer._id),
      },
    );

    await ownershipTransferService.declineOwnershipTransfer(
      String(buyer._id),
      pending.id,
    );

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(main._id));
  });

  it("allows initiator to cancel pending transfer", async () => {
    const main = await createUser("ot-cancel-main@example.com");
    const buyer = await createUser("ot-cancel-buyer@example.com");
    const horse = await createHorse(String(main._id), "Cancel Horse");

    const pending = await ownershipTransferService.createOwnershipTransfer(
      String(main._id),
      {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "transfer_main",
        receiverUserId: String(buyer._id),
      },
    );

    const cancelled = await ownershipTransferService.cancelOwnershipTransfer(
      String(main._id),
      pending.id,
    );

    expect(cancelled.status).toBe("cancelled");
  });

  it("rejects duplicate pending transfer for same receiver", async () => {
    const main = await createUser("ot-dup-main@example.com");
    const buyer = await createUser("ot-dup-buyer@example.com");
    const horse = await createHorse(String(main._id), "Dup Horse");

    await ownershipTransferService.createOwnershipTransfer(String(main._id), {
      entityType: "horse",
      entityId: String(horse._id),
      transferKind: "transfer_main",
      receiverUserId: String(buyer._id),
    });

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

  describe("integration flows (UA-22)", () => {
    it("remove all co-owners then transfer_main to external buyer", async () => {
      const main = await createUser("int-syndicate-main@example.com");
      const partnerA = await createUser("int-syndicate-a@example.com");
      const partnerB = await createUser("int-syndicate-b@example.com");
      const buyer = await createUser("int-syndicate-buyer@example.com");
      const horse = await createHorse(String(main._id), "Syndicate Sale Horse", [
        { userId: String(partnerA._id), ownershipPercentage: 35 },
        { userId: String(partnerB._id), ownershipPercentage: 25 },
      ]);

      await expect(
        ownershipTransferService.createOwnershipTransfer(String(main._id), {
          entityType: "horse",
          entityId: String(horse._id),
          transferKind: "transfer_main",
          receiverUserId: String(buyer._id),
        }),
      ).rejects.toMatchObject({ statusCode: 409 });

      for (const partner of [partnerA, partnerB]) {
        const removePending = await ownershipTransferService.createOwnershipTransfer(
          String(main._id),
          {
            entityType: "horse",
            entityId: String(horse._id),
            transferKind: "remove_co_owner",
            targetCoOwnerUserId: String(partner._id),
          },
        );
        await ownershipTransferService.acceptOwnershipTransfer(
          String(partner._id),
          removePending.id,
        );
      }

      const cleared = await Horse.findById(horse._id).lean();
      expect(cleared?.coOwners ?? []).toHaveLength(0);
      expect(userOwnsEntity(String(partnerA._id), cleared as Record<string, unknown>)).toBe(
        false,
      );
      expect(userOwnsEntity(String(partnerB._id), cleared as Record<string, unknown>)).toBe(
        false,
      );

      const salePending = await ownershipTransferService.createOwnershipTransfer(
        String(main._id),
        {
          entityType: "horse",
          entityId: String(horse._id),
          transferKind: "transfer_main",
          receiverUserId: String(buyer._id),
        },
      );

      await ownershipTransferService.acceptOwnershipTransfer(String(buyer._id), salePending.id);

      const sold = await Horse.findById(horse._id).lean();
      expect(String(sold?.mainOwnerUserId)).toBe(String(buyer._id));
      expect(String(sold?.createdByUserId)).toBe(String(main._id));
      expect(sold?.coOwners ?? []).toHaveLength(0);
      expect(String((sold?.registration as { payerUserId?: unknown })?.payerUserId)).toBe(
        String(buyer._id),
      );
      expect(userOwnsEntity(String(main._id), sold as Record<string, unknown>)).toBe(false);
      expect(userOwnsEntity(String(buyer._id), sold as Record<string, unknown>)).toBe(true);
    });

    it("promote_co_owner keeps remaining co-owners and removes former main access", async () => {
      const main = await createUser("int-promote-main@example.com");
      const promoted = await createUser("int-promote-target@example.com");
      const remaining = await createUser("int-promote-remaining@example.com");
      const horse = await createHorse(String(main._id), "Partner Takeover Horse", [
        { userId: String(promoted._id), ownershipPercentage: 45 },
        { userId: String(remaining._id), ownershipPercentage: 15 },
      ]);

      const pending = await ownershipTransferService.createOwnershipTransfer(String(main._id), {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "promote_co_owner",
        targetCoOwnerUserId: String(promoted._id),
      });

      await ownershipTransferService.acceptOwnershipTransfer(String(promoted._id), pending.id);

      const reloaded = await Horse.findById(horse._id).lean();
      expect(String(reloaded?.mainOwnerUserId)).toBe(String(promoted._id));
      expect((reloaded?.coOwners ?? []).map((entry: { userId: unknown }) => String(entry.userId))).toEqual([
        String(remaining._id),
      ]);
      expect(userOwnsEntity(String(main._id), reloaded as Record<string, unknown>)).toBe(false);
      expect(userOwnsEntity(String(promoted._id), reloaded as Record<string, unknown>)).toBe(
        true,
      );
      expect(userOwnsEntity(String(remaining._id), reloaded as Record<string, unknown>)).toBe(
        true,
      );

      await expect(
        ownershipTransferService.createOwnershipTransfer(String(main._id), {
          entityType: "horse",
          entityId: String(horse._id),
          transferKind: "remove_co_owner",
          targetCoOwnerUserId: String(remaining._id),
        }),
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });
});
