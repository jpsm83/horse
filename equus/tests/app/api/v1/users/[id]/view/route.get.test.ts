/**
 * GET /api/v1/users/:id/view — owner hub view (getUserView shape).
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import User from "@/models/User.ts";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import { signAccessToken } from "@/lib/auth/jwt.ts";
import * as sessionModule from "@/lib/auth/session.ts";
import * as authService from "@/lib/services/authService.ts";
import { GET } from "@/app/api/v1/users/[id]/view/route.ts";

describe("GET /api/v1/users/:id/view", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it("returns 200 when the owner uses a different hex case in the url id", async () => {
    const owner = await authService.register({
      email: "user-view-owner-uppercase@example.com",
      password: "TestPass1!",
      firstName: "Casey",
    });
    const upperId = owner.user.id.toUpperCase();

    const request = new Request(
      `http://localhost:3000/api/v1/users/${upperId}/view`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${owner.accessToken}`,
        },
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: upperId }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.isOwner).toBe(true);
    expect(body.data.user.id).toBe(owner.user.id);
  });

  it("returns 401 for unauthenticated requests", async () => {
    const owner = await authService.register({
      email: "user-view-unauth-target@example.com",
      password: "TestPass1!",
      firstName: "Guestie",
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${owner.user.id}/view`,
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: owner.user.id }),
    });

    expect(response.status).toBe(401);
  });

  it("returns 403 when an authenticated user requests another user's view", async () => {
    const owner = await authService.register({
      email: "user-view-owner-target@example.com",
      password: "TestPass1!",
      firstName: "Owner",
    });
    const other = await authService.register({
      email: "user-view-other-viewer@example.com",
      password: "TestPass1!",
      firstName: "Other",
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${owner.user.id}/view`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${other.accessToken}`,
        },
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: owner.user.id }),
    });

    expect(response.status).toBe(403);
  });

  it("returns 404 for a valid-looking missing user id", async () => {
    const missingId = "507f1f77bcf86cd799439011";
    await User.deleteOne({ _id: missingId });

    vi.spyOn(sessionModule, "assertUserAccountActive").mockResolvedValue(undefined);

    const token = await signAccessToken({
      id: missingId,
      email: "missing-id-user@example.com",
      type: "user",
    });

    const request = new Request(
      `http://localhost:3000/api/v1/users/${missingId}/view`,
      {
        headers: {
          Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${token}`,
        },
      },
    );

    const response = await GET(request, {
      params: Promise.resolve({ id: missingId }),
    });

    expect(response.status).toBe(404);
  });
});
