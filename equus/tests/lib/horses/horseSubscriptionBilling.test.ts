/**
 * Horse subscription billing — payer reassignment on ownership transfer (UA-21).
 */

import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import * as userService from "@/lib/services/userService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";
import {
  assignInitialHorseSubscriptionPayer,
  reassignHorseSubscriptionPayerAfterTransferMain,
} from "@/lib/horses/horseSubscriptionBilling.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Bill",
  });
}

describe("horseSubscriptionBilling", () => {
  it("assignInitialHorseSubscriptionPayer sets registration.payerUserId", async () => {
    const owner = await createUser("bill-assign@example.com");
    const horse = await Horse.create({
      name: "Payer Horse",
      breed: "Thoroughbred",
      sex: "Mare",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });

    await assignInitialHorseSubscriptionPayer(String(horse._id), String(owner._id));

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String((reloaded?.registration as { payerUserId?: unknown })?.payerUserId)).toBe(
      String(owner._id),
    );
  });

  it("reassignHorseSubscriptionPayerAfterTransferMain updates payer without changing status", async () => {
    const main = await createUser("bill-main@example.com");
    const buyer = await createUser("bill-buyer@example.com");
    const horse = await Horse.create({
      name: "Billing Horse",
      breed: "Thoroughbred",
      sex: "Gelding",
      mainOwnerUserId: main._id,
      createdByUserId: main._id,
      registration: {
        isActive: true,
        dataAvailability: "available",
        payerUserId: main._id,
      },
    });

    await reassignHorseSubscriptionPayerAfterTransferMain(String(horse._id), String(buyer._id));

    const reloaded = await Horse.findById(horse._id).lean();
    const registration = reloaded?.registration as {
      payerUserId?: unknown;
      isActive?: boolean;
      dataAvailability?: string;
    };
    expect(String(registration?.payerUserId)).toBe(String(buyer._id));
    expect(registration?.isActive).toBe(true);
    expect(registration?.dataAvailability).toBe("available");
  });

  it("createHorse sets payerUserId to the creating main owner", async () => {
    const owner = await createUser("bill-create@example.com");
    const horse = await horseService.createHorse(String(owner._id), {
      name: "New Bill Horse",
      breed: "Arabian",
      sex: "Mare",
    });

    expect(String((horse.registration as { payerUserId?: unknown })?.payerUserId)).toBe(
      String(owner._id),
    );
  });

  it("transfer_main accept reassigns subscription payer to the new main owner", async () => {
    const main = await createUser("bill-tm-main@example.com");
    const buyer = await createUser("bill-tm-buyer@example.com");
    const horse = await horseService.createHorse(String(main._id), {
      name: "Transfer Bill Horse",
      breed: "Dutch Warmblood",
      sex: "Gelding",
    });

    const pending = await ownershipTransferService.createOwnershipTransfer(String(main._id), {
      entityType: "horse",
      entityId: String(horse._id),
      transferKind: "transfer_main",
      receiverUserId: String(buyer._id),
    });

    await ownershipTransferService.acceptOwnershipTransfer(String(buyer._id), pending.id);

    const reloaded = await Horse.findById(horse._id).lean();
    expect(String(reloaded?.mainOwnerUserId)).toBe(String(buyer._id));
    expect(String((reloaded?.registration as { payerUserId?: unknown })?.payerUserId)).toBe(
      String(buyer._id),
    );
  });
});
