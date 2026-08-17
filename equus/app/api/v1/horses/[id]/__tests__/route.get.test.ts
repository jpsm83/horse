/**
 * GET /api/v1/horses/:id — role-aware horse view (viewerRole, allowedTabs, horse).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as horseService from "@/lib/services/horseService.ts";
import { GET } from "@/app/api/v1/horses/[id]/route.ts";

describe("GET /api/v1/horses/:id", () => {
  it("returns the role-aware view shape for the main owner", async () => {
    const owner = await authService.register({
      email: "horse-view-owner@example.com",
      password: "TestPass1!",
    });

    const horse = await horseService.createHorse(owner.user.id, {
      name: "View Horse",
      breed: "Lusitano",
      sex: "Gelding",
      countryOfBirth: "PT",
    });

    const request = new Request(`http://localhost:3000/api/v1/horses/${horse._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: String(horse._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "main_owner",
      allowedTabs: expect.arrayContaining(["hub", "profile", "admin"]),
      horse: expect.objectContaining({
        name: "View Horse",
        isMainOwner: true,
      }),
    });
  });

  it("returns a guest-scoped view for anonymous viewers of a public horse", async () => {
    const owner = await authService.register({
      email: "horse-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const horse = await horseService.createHorse(owner.user.id, {
      name: "Guest View Horse",
      breed: "Arabian",
      sex: "Mare",
      countryOfBirth: "PT",
      profileVisibility: "public",
    });

    const request = new Request(`http://localhost:3000/api/v1/horses/${horse._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(horse._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.allowedTabs).toEqual(["hub"]);
    expect(body.data.horse.name).toBe("Guest View Horse");
    expect(body.data.horse.isMainOwner).toBeFalsy();
  });
});
