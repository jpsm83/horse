/**
 * GET /api/v1/users/:id/view — role-aware user view (getUserView shape).
 */

import { describe, expect, it } from "vitest";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";
import { GET } from "@/app/api/v1/users/[id]/view/route.ts";

describe("GET /api/v1/users/:id/view", () => {
  it("returns owner-only sections when the requester owns the account", async () => {
    const owner = await authService.register({
      email: "user-view-owner@example.com",
      password: "TestPass1!",
      firstName: "Ownie",
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${owner.user.id}/view`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
        },
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: owner.user.id }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.isOwner).toBe(true);
    expect(body.data.user.id).toBe(owner.user.id);
    expect(body.data.user.sections).toBeDefined();
  });

  it("omits owner-only sections for anonymous viewers", async () => {
    const owner = await authService.register({
      email: "user-view-guest-target@example.com",
      password: "TestPass1!",
      firstName: "Guestie",
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${owner.user.id}/view`,
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: owner.user.id }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.isOwner).toBe(false);
    expect(body.data.user.sections).toBeUndefined();
  });
});
