import { describe, expect, it } from "vitest";

import * as favoriteService from "@/lib/services/favoriteService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as stableService from "@/lib/services/stableService.ts";
import * as userService from "@/lib/services/userService.ts";

async function createUser(email: string) {
  return userService.createCredentialsUser({
    email,
    password: "TestPass1!",
    firstName: "List",
  });
}

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("list favorites filter", () => {
  it("returns only favorited horses when favorites=true", async () => {
    const owner = await createUser("list-fav-horse-owner@example.com");
    const userId = String(owner._id);

    const favorited = await horseService.createHorse(userId, {
      name: "Favorited",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });
    await horseService.createHorse(userId, {
      name: "Not Favorited",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });

    await favoriteService.addFavorite(userId, "horse", String(favorited._id));

    const result = await horseService.listHorses(userId, { mine: true, favorites: true });
    expect(result.total).toBe(1);
    expect(result.horses[0]?.id).toBe(String(favorited._id));
  });

  it("returns empty when favorites=true but user has no favorites", async () => {
    const owner = await createUser("list-fav-empty@example.com");
    const userId = String(owner._id);

    await horseService.createHorse(userId, {
      name: "Plain",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });

    const result = await horseService.listHorses(userId, { mine: true, favorites: true });
    expect(result.total).toBe(0);
    expect(result.horses).toEqual([]);
  });

  it("returns only favorited stables when favorites=true", async () => {
    const owner = await createUser("list-fav-stable-owner@example.com");
    const userId = String(owner._id);

    const favorited = await stableService.createStable(userId, {
      tradeName: "Fav Stable",
      description: "Boarding",
      email: "fav-stable@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });
    await stableService.createStable(userId, {
      tradeName: "Other Stable",
      description: "Boarding",
      email: "other-stable@example.com",
      phoneNumber: "+351912345679",
      address: minimalAddress,
    });

    await favoriteService.addFavorite(userId, "stable", String(favorited._id));

    const result = await stableService.listStables(userId, { favorites: true });
    expect(result.total).toBe(1);
    expect(result.stables[0]?.id).toBe(String(favorited._id));
  });
});
