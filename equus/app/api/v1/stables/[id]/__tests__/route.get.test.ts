/**
 * GET /api/v1/stables/:id — role-aware stable view (viewerRole, allowedTabs, stable).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as stableService from "@/lib/services/stableService.ts";
import { GET } from "@/app/api/v1/stables/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("GET /api/v1/stables/:id", () => {
  it("returns the role-aware view shape for the main owner", async () => {
    const owner = await authService.register({
      email: "stable-view-owner@example.com",
      password: "TestPass1!",
    });

    const stable = await stableService.createStable(owner.user.id, {
      tradeName: "View Stable",
      description: "Owner view test",
      email: "view-stable@example.com",
      phoneNumber: "+351955555555",
      address: minimalAddress,
    });

    const request = new Request(`http://localhost:3000/api/v1/stables/${stable._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: String(stable._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "main_owner",
      allowedTabs: expect.arrayContaining(["hub", "profile", "admin"]),
      stable: expect.objectContaining({
        tradeName: "View Stable",
        isMainOwner: true,
      }),
    });
  });

  it("returns a guest-scoped view for anonymous viewers of a public stable", async () => {
    const owner = await authService.register({
      email: "stable-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const stable = await stableService.createStable(owner.user.id, {
      tradeName: "Guest View Stable",
      description: "Guest view test",
      email: "guest-stable@example.com",
      phoneNumber: "+351966666666",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/stables/${stable._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(stable._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.stable.tradeName).toBe("Guest View Stable");
    expect(body.data.stable.isMainOwner).toBeFalsy();
  });
});
