/**
 * Favorites API route tests.
 */

import { describe, expect, it } from "vitest";

import * as authService from "@/lib/services/authService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import * as stableService from "@/lib/services/stableService.ts";
import { GET, POST, DELETE } from "@/app/api/v1/users/me/favorites/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

describe("/api/v1/users/me/favorites", () => {
  it("GET returns empty favorites initially", async () => {
    const user = await authService.register({
      email: "fav-api-get@example.com",
      password: "TestPass1!",
      firstName: "Fav",
    });

    const response = await GET(
      new Request("http://localhost:3000/api/v1/users/me/favorites", {
        headers: authHeaders(user.accessToken),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.favorites).toEqual([]);
  });

  it("POST adds a favorite and GET lists it", async () => {
    const user = await authService.register({
      email: "fav-api-post@example.com",
      password: "TestPass1!",
      firstName: "Fav",
    });

    const horse = await horseService.createHorse(user.user.id, {
      name: "API Star",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });

    const postResponse = await POST(
      new Request("http://localhost:3000/api/v1/users/me/favorites", {
        method: "POST",
        headers: authHeaders(user.accessToken),
        body: JSON.stringify({ entityType: "horse", entityId: String(horse._id) }),
      }),
    );
    expect(postResponse.status).toBe(201);

    const getResponse = await GET(
      new Request("http://localhost:3000/api/v1/users/me/favorites?entityType=horse", {
        headers: authHeaders(user.accessToken),
      }),
    );
    expect(getResponse.status).toBe(200);
    const body = await getResponse.json();
    expect(body.data.favorites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: "horse",
          entityId: String(horse._id),
          label: "API Star",
        }),
      ]),
    );
  });

  it("DELETE removes a favorite", async () => {
    const user = await authService.register({
      email: "fav-api-delete@example.com",
      password: "TestPass1!",
      firstName: "Fav",
    });

    const stable = await stableService.createStable(user.user.id, {
      tradeName: "API Stable",
      description: "Boarding",
      email: "api-stable@example.com",
      phoneNumber: "+351912345678",
      address: minimalAddress,
    });

    await POST(
      new Request("http://localhost:3000/api/v1/users/me/favorites", {
        method: "POST",
        headers: authHeaders(user.accessToken),
        body: JSON.stringify({ entityType: "stable", entityId: String(stable._id) }),
      }),
    );

    const deleteResponse = await DELETE(
      new Request("http://localhost:3000/api/v1/users/me/favorites", {
        method: "DELETE",
        headers: authHeaders(user.accessToken),
        body: JSON.stringify({ entityType: "stable", entityId: String(stable._id) }),
      }),
    );
    expect(deleteResponse.status).toBe(200);

    const getResponse = await GET(
      new Request("http://localhost:3000/api/v1/users/me/favorites?entityType=stable", {
        headers: authHeaders(user.accessToken),
      }),
    );
    const body = await getResponse.json();
    expect(body.data.favorites).toEqual([]);
  });

  it("POST returns 404 when favoriting a private horse", async () => {
    const owner = await authService.register({
      email: "fav-api-owner@example.com",
      password: "TestPass1!",
      firstName: "Owner",
    });
    const outsider = await authService.register({
      email: "fav-api-outsider@example.com",
      password: "TestPass1!",
      firstName: "Out",
    });

    const horse = await horseService.createHorse(owner.user.id, {
      name: "Secret",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "US",
    });
    await horseService.updateHorseDiscovery(owner.user.id, String(horse._id), {
      profileVisibility: "owner",
    });

    const response = await POST(
      new Request("http://localhost:3000/api/v1/users/me/favorites", {
        method: "POST",
        headers: authHeaders(outsider.accessToken),
        body: JSON.stringify({ entityType: "horse", entityId: String(horse._id) }),
      }),
    );
    expect(response.status).toBe(404);
  });
});
