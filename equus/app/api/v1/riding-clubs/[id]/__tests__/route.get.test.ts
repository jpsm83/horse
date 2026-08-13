/**
 * GET /api/v1/riding-clubs/:id — role-aware riding club view.
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as ridingClubService from "@/lib/services/ridingClubService.ts";
import { GET } from "@/app/api/v1/riding-clubs/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("GET /api/v1/riding-clubs/:id", () => {
  it("returns the role-aware view shape for the main owner", async () => {
    const owner = await authService.register({
      email: "club-view-owner@example.com",
      password: "TestPass1!",
    });

    const ridingClub = await ridingClubService.createRidingClub(owner.user.id, {
      clubName: "View Club",
      description: "Owner view test",
      email: "view-club@example.com",
      phoneNumber: "+351944444441",
      address: minimalAddress,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/riding-clubs/${ridingClub._id}`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
        },
      },
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(ridingClub._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "main_owner",
      allowedTabs: expect.arrayContaining(["hub", "profile", "admin"]),
      ridingClub: expect.objectContaining({
        clubName: "View Club",
        isMainOwner: true,
      }),
    });
  });

  it("returns a guest-scoped view for anonymous viewers of a public riding club", async () => {
    const owner = await authService.register({
      email: "club-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const ridingClub = await ridingClubService.createRidingClub(owner.user.id, {
      clubName: "Guest View Club",
      description: "Guest view test",
      email: "guest-club@example.com",
      phoneNumber: "+351944444442",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/riding-clubs/${ridingClub._id}`,
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(ridingClub._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.ridingClub.clubName).toBe("Guest View Club");
    expect(body.data.ridingClub.isMainOwner).toBeFalsy();
  });
});
