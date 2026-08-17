/**
 * GET /api/v1/auth/me — inactive account rejected on protected access (UA-04).
 */

import { describe, expect, it } from "vitest";
import User from "@/models/User.ts";
import { GET } from "@/app/api/v1/auth/me/route.ts";
import * as authService from "@/lib/services/authService.ts";

describe("GET /api/v1/auth/me", () => {
  it("returns 401 for inactive users with a still-valid access token", async () => {
    const registered = await authService.register({
      email: "auth-me-inactive@example.com",
      password: "TestPass1!",
    });

    await User.updateOne({ _id: registered.user.id }, { $set: { isActive: false } });

    const request = new Request("http://localhost:3000/api/v1/auth/me", {
      headers: {
        Authorization: `Bearer ${registered.accessToken}`,
      },
    });

    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
