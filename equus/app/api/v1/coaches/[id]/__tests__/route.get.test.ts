/**
 * GET /api/v1/coaches/:id — role-aware coach view (viewerRole, allowedTabs, coach).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as coachService from "@/lib/services/coachService.ts";
import { GET } from "@/app/api/v1/coaches/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("GET /api/v1/coaches/:id", () => {
  it("returns the role-aware view shape for the owner", async () => {
    const owner = await authService.register({
      email: "coach-view-owner@example.com",
      password: "TestPass1!",
    });

    const coach = await coachService.createCoach(owner.user.id, {
      displayName: "View Coach",
      bio: "Owner view test",
      email: "view-coach@example.com",
      phoneNumber: "+351911111111",
      address: minimalAddress,
    });

    const request = new Request(`http://localhost:3000/api/v1/coaches/${coach._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: String(coach._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "owner",
      allowedTabs: expect.arrayContaining(["hub", "profile"]),
      coach: expect.objectContaining({
        displayName: "View Coach",
        isOwner: true,
      }),
    });
    expect(body.data.allowedTabs).not.toContain("admin");
  });

  it("returns a guest-scoped view for anonymous viewers of a public coach", async () => {
    const owner = await authService.register({
      email: "coach-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const coach = await coachService.createCoach(owner.user.id, {
      displayName: "Guest View Coach",
      bio: "Guest view test",
      email: "guest-coach@example.com",
      phoneNumber: "+351911111112",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/coaches/${coach._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(coach._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.coach.displayName).toBe("Guest View Coach");
    expect(body.data.coach.isOwner).toBeFalsy();
  });
});
