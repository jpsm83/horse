/**
 * GET /api/v1/trainers/:id — role-aware trainer view (viewerRole, allowedTabs, trainer).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as trainerService from "@/lib/services/trainerService.ts";
import { GET } from "@/app/api/v1/trainers/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("GET /api/v1/trainers/:id", () => {
  it("returns the role-aware view shape for the owner", async () => {
    const owner = await authService.register({
      email: "trainer-view-owner@example.com",
      password: "TestPass1!",
    });

    const trainer = await trainerService.createTrainer(owner.user.id, {
      displayName: "View Trainer",
      bio: "Owner view test",
      email: "view-trainer@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    const request = new Request(`http://localhost:3000/api/v1/trainers/${trainer._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: String(trainer._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "owner",
      allowedTabs: expect.arrayContaining(["hub", "profile"]),
      trainer: expect.objectContaining({
        displayName: "View Trainer",
        isOwner: true,
      }),
    });
    expect(body.data.allowedTabs).not.toContain("admin");
  });

  it("returns a guest-scoped view for anonymous viewers of a public trainer", async () => {
    const owner = await authService.register({
      email: "trainer-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const trainer = await trainerService.createTrainer(owner.user.id, {
      displayName: "Guest View Trainer",
      bio: "Guest view test",
      email: "guest-trainer@example.com",
      phoneNumber: "+351911111112",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/trainers/${trainer._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(trainer._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.trainer.displayName).toBe("Guest View Trainer");
    expect(body.data.trainer.isOwner).toBeFalsy();
  });
});
