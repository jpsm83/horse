/**
 * GET /api/v1/transports/:id — role-aware transport view.
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import * as transportService from "@/lib/services/transportService.ts";
import { GET } from "@/app/api/v1/transports/[id]/route.ts";

const minimalAddress = {
  country: "Portugal",
  city: "Lisbon",
  street: "Main St",
  postCode: "1000",
};

describe("GET /api/v1/transports/:id", () => {
  it("returns the role-aware view shape for the main owner", async () => {
    const owner = await authService.register({
      email: "transport-view-owner@example.com",
      password: "TestPass1!",
    });

    const transport = await transportService.createTransport(owner.user.id, {
      companyName: "View Transport",
      description: "Owner view test",
      email: "view-transport@example.com",
      phoneNumber: "+351933333331",
      address: minimalAddress,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/transports/${transport._id}`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
        },
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: String(transport._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data).toMatchObject({
      viewerRole: "main_owner",
      allowedTabs: expect.arrayContaining(["hub", "profile", "admin"]),
      transport: expect.objectContaining({
        companyName: "View Transport",
        isMainOwner: true,
      }),
    });
  });

  it("returns a guest-scoped view for anonymous viewers of a public transport", async () => {
    const owner = await authService.register({
      email: "transport-view-guest-owner@example.com",
      password: "TestPass1!",
    });

    const transport = await transportService.createTransport(owner.user.id, {
      companyName: "Guest View Transport",
      description: "Guest view test",
      email: "guest-transport@example.com",
      phoneNumber: "+351933333332",
      address: minimalAddress,
      isPublic: true,
    });

    const request = new Request(
      `http://localhost:3000/api/v1/transports/${transport._id}`,
    );
    const response = await GET(request, {
      params: Promise.resolve({ id: String(transport._id) }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.viewerRole).toBe("guest");
    expect(body.data.transport.companyName).toBe("Guest View Transport");
    expect(body.data.transport.isMainOwner).toBeFalsy();
  });
});
