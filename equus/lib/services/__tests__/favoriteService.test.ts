import { describe, expect, it } from "vitest";

import User from "@/models/User.ts";
import * as favoriteService from "@/lib/services/favoriteService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as stableService from "@/lib/services/stableService.ts";
import * as userService from "@/lib/services/userService.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "Favorite",
  });
}

describe("favoriteService", () => {
  it("adds a favorite for a viewable horse", async () => {
    const owner = await createUser("fav-add-owner@example.com");
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Star",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });

    await favoriteService.addFavorite(String(owner._id), "horse", String(horse._id));

    const favorites = await favoriteService.listFavorites(String(owner._id));
    expect(favorites).toHaveLength(1);
    expect(favorites[0]).toMatchObject({
      entityType: "horse",
      entityId: String(horse._id),
    });
    expect(favorites[0]?.createdAt).toBeTruthy();
  });

  it("is idempotent when adding the same favorite twice", async () => {
    const owner = await createUser("fav-dup-owner@example.com");
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Dup",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });

    await favoriteService.addFavorite(String(owner._id), "horse", String(horse._id));
    await favoriteService.addFavorite(String(owner._id), "horse", String(horse._id));

    const favorites = await favoriteService.listFavorites(String(owner._id), "horse");
    expect(favorites).toHaveLength(1);
  });

  it("removes a favorite", async () => {
    const owner = await createUser("fav-remove-owner@example.com");
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Remove Me",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });

    await favoriteService.addFavorite(String(owner._id), "horse", String(horse._id));
    await favoriteService.removeFavorite(String(owner._id), "horse", String(horse._id));

    const favorites = await favoriteService.listFavorites(String(owner._id));
    expect(favorites).toHaveLength(0);
  });

  it("lists favorites filtered by entity type", async () => {
    const owner = await createUser("fav-list-owner@example.com");
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Horse Fav",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });
    const stable = await stableService.createStable(String(owner._id), {
      tradeName: "Stable Fav",
      description: "Boarding",
      email: "stable-fav@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    await favoriteService.addFavorite(String(owner._id), "horse", String(horse._id));
    await favoriteService.addFavorite(String(owner._id), "stable", String(stable._id));

    const horses = await favoriteService.listFavorites(String(owner._id), "horse");
    const stables = await favoriteService.listFavorites(String(owner._id), "stable");

    expect(horses).toHaveLength(1);
    expect(horses[0]?.entityType).toBe("horse");
    expect(stables).toHaveLength(1);
    expect(stables[0]?.entityType).toBe("stable");
  });

  it("rejects favoriting a horse the user cannot view", async () => {
    const owner = await createUser("fav-private-owner@example.com");
    const outsider = await createUser("fav-private-outsider@example.com");
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Private",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });

    await horseService.updateHorseDiscovery(String(owner._id), String(horse._id), {
      profileVisibility: "owner",
    });

    await expect(
      favoriteService.addFavorite(String(outsider._id), "horse", String(horse._id)),
    ).rejects.toMatchObject({ statusCode: 404 });

    const user = await User.findById(outsider._id).lean();
    expect(user?.favorites ?? []).toHaveLength(0);
  });

  it("returns favorite id set for list filters", async () => {
    const owner = await createUser("fav-set-owner@example.com");
    const horse = await horseService.createHorse(String(owner._id), {
      name: "Set Horse",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });

    await favoriteService.addFavorite(String(owner._id), "horse", String(horse._id));

    const ids = await favoriteService.getFavoriteIdSet(String(owner._id), "horse");
    expect(ids.has(String(horse._id))).toBe(true);
  });
});
