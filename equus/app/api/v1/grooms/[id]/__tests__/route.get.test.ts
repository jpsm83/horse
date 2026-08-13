/**
 * GET /api/v1/grooms/:id — role-aware groom view (viewerRole, allowedTabs, groom).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as groomService from "@/lib/services/groomService.ts";
import { GET } from "@/app/api/v1/grooms/[id]/route.ts";

describe("GET /api/v1/grooms/:id", () => {
  it("returns the role-aware view shape for the owner", async () => {
    const owner = await authService.register({
      email: "groom-view-owner@example.com",
      password: "TestPass1!",
    });

    const groom = await groomService.createGroom(owner.user.id, {
      displayName: "View Groom",
      bio: "Owner view test",
      email: "view-groom@example.com",
    });

    const request = new Request(`http://localhost:3000/api/v1/grooms/${groom._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: String(groom._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "owner",
      allowedTabs: expect.arrayContaining(["hub", "profile"]),
      groom: expect.objectContaining({
        displayName: "View Groom",
        isOwner: true,
      }),
    });
    expect(body.data.allowedTabs).not.toContain("admin");
  });

  it("returns a guest-scoped view for anonymous viewers of a public groom", async () => {
    const owner = await authService.register({
      email: "groom-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const groom = await groomService.createGroom(owner.user.id, {
      displayName: "Guest View Groom",
      bio: "Guest view test",
      email: "guest-groom@example.com",
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/grooms/${groom._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(groom._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.groom.displayName).toBe("Guest View Groom");
    expect(body.data.groom.isOwner).toBeFalsy();
  });
});
