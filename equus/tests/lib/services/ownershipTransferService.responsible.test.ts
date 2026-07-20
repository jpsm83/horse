/**
 * Ownership transfer service — add_responsible / remove_responsible.
 */

import { describe, expect, it } from "vitest";
import Horse from "@/models/Horse.ts";
import * as userService from "@/lib/services/userService.ts";
import * as ownershipTransferService from "@/lib/services/ownershipTransferService.ts";
import { ApiError } from "@/lib/api/errors.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Test",
  });
}

async function createHorse(ownerId: string) {
  return Horse.create({
    name: "Test Horse",
    breed: "Thoroughbred",
    sex: "Mare",
    mainOwnerUserId: ownerId,
    createdByUserId: ownerId,
  });
}

describe("ownershipTransferService — responsible persons", () => {
  it("add_responsible: accept adds to horse.responsibles", async () => {
    const owner = await createUser("resp-add-owner@example.com");
    const helper = await createUser("resp-add-helper@example.com");
    const horse = await createHorse(String(owner._id));

    const pending = await ownershipTransferService.createOwnershipTransfer(String(owner._id), {
      entityType: "horse",
      entityId: String(horse._id),
      transferKind: "add_responsible",
      receiverUserId: String(helper._id),
    });

    await ownershipTransferService.acceptOwnershipTransfer(String(helper._id), pending.id);

    const reloaded = await Horse.findById(horse._id).lean();
    const responsibleIds = (reloaded?.responsibles ?? []).map((r: { userId: unknown }) => String(r.userId));
    expect(responsibleIds).toContain(String(helper._id));
  });

  it("remove_responsible: accept removes from horse.responsibles", async () => {
    const owner = await createUser("resp-rem-owner@example.com");
    const helper = await createUser("resp-rem-helper@example.com");
    const horse = await Horse.create({
      name: "Remove Horse",
      breed: "Thoroughbred",
      sex: "Mare",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
      responsibles: [{ userId: helper._id }],
    });

    const pending = await ownershipTransferService.createOwnershipTransfer(String(owner._id), {
      entityType: "horse",
      entityId: String(horse._id),
      transferKind: "remove_responsible",
      targetCoOwnerUserId: String(helper._id),
    });

    await ownershipTransferService.acceptOwnershipTransfer(String(helper._id), pending.id);

    const reloaded = await Horse.findById(horse._id).lean();
    expect((reloaded?.responsibles ?? []).length).toBe(0);
  });

  it("non-owner cannot add responsible person", async () => {
    const owner = await createUser("resp-auth-owner@example.com");
    const outsider = await createUser("resp-auth-outsider@example.com");
    const helper = await createUser("resp-auth-helper@example.com");
    const horse = await createHorse(String(owner._id));

    await expect(
      ownershipTransferService.createOwnershipTransfer(String(outsider._id), {
        entityType: "horse",
        entityId: String(horse._id),
        transferKind: "add_responsible",
        receiverUserId: String(helper._id),
      }),
    ).rejects.toThrow(ApiError);
  });
});
