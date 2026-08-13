/**
 * GET /api/v1/breeders/:id — role-aware breeder view (viewerRole, allowedTabs, breeder).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as breederService from "@/lib/services/breederService.ts";
import { GET } from "@/app/api/v1/breeders/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Porto",
  street: "Main St",
  postCode: "4000",
};

describe("GET /api/v1/breeders/:id", () => {
  it("returns the role-aware view shape for the main owner", async () => {
    const owner = await authService.register({
      email: "breeder-view-owner@example.com",
      password: "TestPass1!",
    });

    const breeder = await breederService.createBreeder(owner.user.id, {
      operationName: "View Breeder",
      description: "Owner view test",
      email: "view-breeder@example.com",
      phoneNumber: "+351977777777",
      address: minimalAddress,
    });

    const request = new Request(`http://localhost:3000/api/v1/breeders/${breeder._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: String(breeder._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "main_owner",
      allowedTabs: expect.arrayContaining(["hub", "profile", "admin"]),
      breeder: expect.objectContaining({
        operationName: "View Breeder",
        isMainOwner: true,
      }),
    });
  });

  it("returns a guest-scoped view for anonymous viewers of a public breeder", async () => {
    const owner = await authService.register({
      email: "breeder-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const breeder = await breederService.createBreeder(owner.user.id, {
      operationName: "Guest View Breeder",
      description: "Guest view test",
      email: "guest-breeder@example.com",
      phoneNumber: "+351988888888",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/breeders/${breeder._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(breeder._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.breeder.operationName).toBe("Guest View Breeder");
    expect(body.data.breeder.isMainOwner).toBeFalsy();
  });
});
