/**
 * GET /api/v1/veterinaries/:id — role-aware veterinary view.
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as veterinaryService from "@/lib/services/veterinaryService.ts";
import { GET } from "@/app/api/v1/veterinaries/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("GET /api/v1/veterinaries/:id", () => {
  it("returns the role-aware view shape for the owner", async () => {
    const owner = await authService.register({
      email: "vet-view-owner@example.com",
      password: "TestPass1!",
    });

    const veterinary = await veterinaryService.createVeterinary(owner.user.id, {
      practiceName: "View Vet",
      description: "Owner view test",
      email: "view-vet@example.com",
      phoneNumber: "+351922222221",
      address: minimalAddress,
    });

    const request = new Request(`http://localhost:3000/api/v1/veterinaries/${veterinary._id}`, {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
      },
    });
    const response = await GET(request, {
      params: Promise.resolve({ id: String(veterinary._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "owner",
      allowedTabs: expect.arrayContaining(["hub", "profile"]),
      veterinary: expect.objectContaining({
        practiceName: "View Vet",
        isOwner: true,
      }),
    });
    expect(body.data.allowedTabs).not.toContain("admin");
  });

  it("returns a guest-scoped view for anonymous viewers of a public veterinary", async () => {
    const owner = await authService.register({
      email: "vet-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const veterinary = await veterinaryService.createVeterinary(owner.user.id, {
      practiceName: "Guest View Vet",
      description: "Guest view test",
      email: "guest-vet@example.com",
      phoneNumber: "+351922222222",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(`http://localhost:3000/api/v1/veterinaries/${veterinary._id}`);
    const response = await GET(request, {
      params: Promise.resolve({ id: String(veterinary._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.veterinary.practiceName).toBe("Guest View Vet");
    expect(body.data.veterinary.isOwner).toBeFalsy();
  });
});
