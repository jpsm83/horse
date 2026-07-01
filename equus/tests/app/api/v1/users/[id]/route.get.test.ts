/**
 * GET /api/v1/users/:id — public user profile card with optional auth (UA-06).
 */

import { describe, expect, it } from "vitest";
import User from "@/models/User.ts";
import Horse from "@/models/Horse.ts";
import Relationship from "@/models/Relationship.ts";
import { GET } from "@/app/api/v1/users/[id]/route.ts";
import * as authService from "@/lib/services/authService.ts";
import * as userService from "@/lib/services/userService.ts";
import { createTestTrainer } from "@/tests/helpers/businessRoleFixtures.ts";

describe("GET /api/v1/users/:id", () => {
  it("returns a public profile card for anonymous viewers when visibility is public", async () => {
    const target = await userService.createCredentialsUser({
      email: "api-public-user@example.com",
      password: "TestPass1!",
      firstName: "Public",
      lastName: "Owner",
      username: "publicowner",
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${String(target._id)}`,
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(target._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.user).toMatchObject({
      id: String(target._id),
      firstName: "Public",
      lastName: "Owner",
      email: "api-public-user@example.com",
      username: "publicowner",
    });
  });

  it("returns 404 for platform-only profiles when the viewer is anonymous", async () => {
    const target = await userService.createCredentialsUser({
      email: "api-platform-user@example.com",
      password: "TestPass1!",
    });

    await userService.updatePersonalDetails(String(target._id), {
      preferences: { profileVisibility: "platform" },
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${String(target._id)}`,
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(target._id) }),
    });

    expect(response.status).toBe(404);
  });

  it("returns platform-only profiles for signed-in viewers", async () => {
    const target = await userService.createCredentialsUser({
      email: "api-platform-target@example.com",
      password: "TestPass1!",
      firstName: "Platform",
      lastName: "Target",
    });
    await userService.updatePersonalDetails(String(target._id), {
      preferences: { profileVisibility: "platform" },
    });

    const viewer = await authService.register({
      email: "api-platform-viewer@example.com",
      password: "TestPass1!",
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${String(target._id)}`,
      {
        headers: {
          Authorization: `Bearer ${viewer.accessToken}`,
        },
      },
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(target._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.user.email).toBe("api-platform-target@example.com");
  });

  it("treats deactivated bearer tokens as anonymous", async () => {
    const target = await userService.createCredentialsUser({
      email: "api-inactive-viewer-target@example.com",
      password: "TestPass1!",
    });
    await userService.updatePersonalDetails(String(target._id), {
      preferences: { profileVisibility: "platform" },
    });

    const viewer = await authService.register({
      email: "api-inactive-viewer@example.com",
      password: "TestPass1!",
    });
    await User.updateOne({ _id: viewer.user.id }, { $set: { isActive: false } });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${String(target._id)}`,
      {
        headers: {
          Authorization: `Bearer ${viewer.accessToken}`,
        },
      },
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(target._id) }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 400 for invalid user ids", async () => {
    const request = new Request("http://localhost:3000/api/v1/users/not-an-id");
    const response = await GET(request, {
      params: Promise.resolve({ id: "not-an-id" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 for missing users", async () => {
    const missingId = "507f1f77bcf86cd799439011";
    const request = new Request(`http://localhost:3000/api/v1/users/${missingId}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: missingId }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 404 for relationships-only profiles when the viewer has no link", async () => {
    const target = await userService.createCredentialsUser({
      email: "api-relationships-blocked@example.com",
      password: "TestPass1!",
    });
    await userService.updatePersonalDetails(String(target._id), {
      preferences: { profileVisibility: "relationships" },
    });

    const viewer = await authService.register({
      email: "api-relationships-viewer@example.com",
      password: "TestPass1!",
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${String(target._id)}`,
      { headers: { Authorization: `Bearer ${viewer.accessToken}` } },
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(target._id) }),
    });

    expect(response.status).toBe(404);
  });

  it("returns private profiles for linked viewers with an accepted relationship", async () => {
    const target = await userService.createCredentialsUser({
      email: "api-private-rel@example.com",
      password: "TestPass1!",
      firstName: "Private",
      lastName: "Owner",
    });
    await userService.updatePersonalDetails(String(target._id), {
      preferences: { profileVisibility: "private" },
    });

    const viewer = await authService.register({
      email: "api-private-rel-viewer@example.com",
      password: "TestPass1!",
    });

    const horse = await Horse.create({
      name: "API Matrix Horse",
      breed: "TB",
      sex: "Gelding",
      mainOwnerUserId: target._id,
      createdByUserId: target._id,
    });
    const trainer = await createTestTrainer(viewer.user.id);

    await Relationship.create({
      horseId: horse._id,
      relationshipType: "trainer",
      status: "accepted",
      requesterUserId: target._id,
      receiverUserId: viewer.user.id,
      receiverAccountType: "trainer",
      receiverAccountId: trainer._id,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${String(target._id)}`,
      { headers: { Authorization: `Bearer ${viewer.accessToken}` } },
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(target._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.user.email).toBe("api-private-rel@example.com");
  });
});
