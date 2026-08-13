/**
 * GET /api/v1/riders/:id — role-aware rider view (viewerRole, allowedTabs, rider).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as riderService from "@/lib/services/riderService.ts";
import { GET } from "@/app/api/v1/riders/[id]/route.ts";

describe("GET /api/v1/riders/:id", () => {
  it("returns the role-aware view shape for the owner", async () => {
    const owner = await authService.register({
      email: "rider-view-owner@example.com",
      password: "TestPass1!",
    });

    const rider = await riderService.createRider(owner.user.id, {
      displayName: "View Rider",
      bio: "Owner view test",
      email: "view-rider@example.com",
    });

    const request = new Request(`http://localhost:3000/api/v1/riders/${rider._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: String(rider._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "owner",
      allowedTabs: expect.arrayContaining(["hub", "profile"]),
      rider: expect.objectContaining({
        displayName: "View Rider",
        isOwner: true,
      }),
    });
    expect(body.data.allowedTabs).not.toContain("admin");
  });

  it("returns a guest-scoped view for anonymous viewers of a public rider", async () => {
    const owner = await authService.register({
      email: "rider-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const rider = await riderService.createRider(owner.user.id, {
      displayName: "Guest View Rider",
      bio: "Guest view test",
      email: "guest-rider@example.com",
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/riders/${rider._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(rider._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.rider.displayName).toBe("Guest View Rider");
    expect(body.data.rider.isOwner).toBeFalsy();
  });
});
