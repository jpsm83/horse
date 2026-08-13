/**
 * GET /api/v1/farriers/:id — role-aware farrier view.
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as farrierService from "@/lib/services/farrierService.ts";
import { GET } from "@/app/api/v1/farriers/[id]/route.ts";

describe("GET /api/v1/farriers/:id", () => {
  it("returns the role-aware view shape for the owner", async () => {
    const owner = await authService.register({
      email: "farrier-view-owner@example.com",
      password: "TestPass1!",
    });

    const farrier = await farrierService.createFarrier(owner.user.id, {
      displayName: "View Farrier",
      email: "view-farrier@example.com",
    });

    const request = new Request(`http://localhost:3000/api/v1/farriers/${farrier._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });
    const response = await GET(request, {
      params: Promise.resolve({ id: String(farrier._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "owner",
      allowedTabs: expect.arrayContaining(["hub", "profile"]),
      farrier: expect.objectContaining({
        displayName: "View Farrier",
        isOwner: true,
      }),
    });
    expect(body.data.allowedTabs).not.toContain("admin");
  });

  it("returns a guest-scoped view for anonymous viewers of a public farrier", async () => {
    const owner = await authService.register({
      email: "farrier-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const farrier = await farrierService.createFarrier(owner.user.id, {
      displayName: "Guest View Farrier",
      email: "guest-farrier@example.com",
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/farriers/${farrier._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(farrier._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.farrier.displayName).toBe("Guest View Farrier");
    expect(body.data.farrier.isOwner).toBeFalsy();
  });
});
