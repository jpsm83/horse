import { describe, expect, it } from "vitest";
import mongoose from "mongoose";

import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import Stable from "@/models/Stable.ts";
import User from "@/models/User.ts";
import { ApiError } from "@/lib/api/errors.ts";
import { assertCanDirectMessage } from "@/lib/privacy/directMessageAccess.ts";
import * as userService from "@/lib/services/userService.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Chat",
  });
}

async function setDmPreference(userId: string, allowDirectMessagesFrom: string) {
  await User.findByIdAndUpdate(userId, {
    $set: { "preferences.allowDirectMessagesFrom": allowDirectMessagesFrom },
  });
}

async function blockUser(blockerId: string, blockedId: string) {
  await User.findByIdAndUpdate(blockerId, {
    $push: {
      blocks: {
        blockedUserId: new mongoose.Types.ObjectId(blockedId),
        createdAt: new Date(),
      },
    },
  });
}

describe("assertCanDirectMessage", () => {
  it("allows messaging when target accepts everyone", async () => {
    const sender = await createUser("dm-everyone-sender@example.com");
    const target = await createUser("dm-everyone-target@example.com");
    await setDmPreference(String(target._id), "everyone");

    await expect(
      assertCanDirectMessage(String(sender._id), String(target._id)),
    ).resolves.toBeUndefined();
  });

  it("denies when target accepts nobody", async () => {
    const sender = await createUser("dm-nobody-sender@example.com");
    const target = await createUser("dm-nobody-target@example.com");
    await setDmPreference(String(target._id), "nobody");

    await expect(
      assertCanDirectMessage(String(sender._id), String(target._id)),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("denies relationships-only without a graph link", async () => {
    const sender = await createUser("dm-rel-sender@example.com");
    const target = await createUser("dm-rel-target@example.com");
    await setDmPreference(String(target._id), "relationships");

    await expect(
      assertCanDirectMessage(String(sender._id), String(target._id)),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("allows relationships-only with an accepted horse relationship", async () => {
    const owner = await createUser("dm-rel-owner@example.com");
    const provider = await createUser("dm-rel-provider@example.com");
    await setDmPreference(String(provider._id), "relationships");

    const horse = await Horse.create({
      name: "Rel Horse",
      breed: "Arabian",
      sex: "Mare",
      mainOwnerUserId: owner._id,
      createdByUserId: owner._id,
    });

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "stable",
      status: "accepted",
      requesterUserId: owner._id,
      receiverUserId: provider._id,
      receiverAccountType: "stable",
    });

    await expect(
      assertCanDirectMessage(String(owner._id), String(provider._id)),
    ).resolves.toBeUndefined();
  });

  it("allows relationships-only with shared co-ownership on a horse", async () => {
    const mainOwner = await createUser("dm-co-main@example.com");
    const coOwner = await createUser("dm-co-partner@example.com");
    await setDmPreference(String(coOwner._id), "relationships");

    await Horse.create({
      name: "Shared Horse",
      breed: "Arabian",
      sex: "Mare",
      mainOwnerUserId: mainOwner._id,
      createdByUserId: mainOwner._id,
      coOwners: [{ userId: coOwner._id, ownershipPercentage: 40 }],
    });

    await expect(
      assertCanDirectMessage(String(mainOwner._id), String(coOwner._id)),
    ).resolves.toBeUndefined();
  });

  it("denies when sender blocked target", async () => {
    const sender = await createUser("dm-block-sender@example.com");
    const target = await createUser("dm-block-target@example.com");
    await setDmPreference(String(target._id), "everyone");
    await blockUser(String(sender._id), String(target._id));

    await expect(
      assertCanDirectMessage(String(sender._id), String(target._id)),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("denies when target blocked sender", async () => {
    const sender = await createUser("dm-blocked-sender@example.com");
    const target = await createUser("dm-blocked-target@example.com");
    await setDmPreference(String(target._id), "everyone");
    await blockUser(String(target._id), String(sender._id));

    await expect(
      assertCanDirectMessage(String(sender._id), String(target._id)),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects messaging yourself", async () => {
    const user = await createUser("dm-self@example.com");

    await expect(assertCanDirectMessage(String(user._id), String(user._id))).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("allows relationships-only with shared stable co-ownership", async () => {
    const mainOwner = await createUser("dm-stable-main@example.com");
    const coOwner = await createUser("dm-stable-co@example.com");
    await setDmPreference(String(coOwner._id), "relationships");

    await Stable.create({
      tradeName: "Shared Stable",
      description: "Boarding",
      email: "stable@example.com",
      phoneNumber: "+351912345678",
      address: { country: "PT", city: "Lisbon", street: "Main", postCode: "1000" },
      mainOwnerUserId: mainOwner._id,
      createdByUserId: mainOwner._id,
      coOwners: [{ userId: coOwner._id, ownershipPercentage: 30 }],
    });

    await expect(
      assertCanDirectMessage(String(mainOwner._id), String(coOwner._id)),
    ).resolves.toBeUndefined();
  });
});
