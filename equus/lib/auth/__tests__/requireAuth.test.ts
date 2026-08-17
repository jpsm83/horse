/**
 * requireAuthFromRequest — live isActive check after JWT verify (UA-04).
 */

import { describe, expect, it } from "vitest";
import User from "@/models/User.ts";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import { requireAuthFromRequest } from "@/lib/auth/requireAuth.ts";
import * as authService from "@/lib/services/authService.ts";

describe("requireAuthFromRequest", () => {
  it("returns AuthUser when the access token is valid and the account is active", async () => {
    const registered = await authService.register({
      email: "require-auth-active@example.com",
      password: "TestPass1!",
    });

    const request = new Request("http://localhost:3000/api/v1/users/me", {
      headers: {
        Authorization: `Bearer ${registered.accessToken}`,
      },
    });

    const user = await requireAuthFromRequest(request);
    expect(user.id).toBe(registered.user.id);
  });

  it("updates lastActiveAt on successful authentication", async () => {
    const registered = await authService.register({
      email: "require-auth-touch@example.com",
      password: "TestPass1!",
    });

    const request = new Request("http://localhost:3000/api/v1/users/me", {
      headers: {
        Authorization: `Bearer ${registered.accessToken}`,
      },
    });

    await requireAuthFromRequest(request);

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const reloaded = await User.findById(registered.user.id).select("lastActiveAt").lean();
      if (reloaded?.lastActiveAt instanceof Date) {
        expect(reloaded.lastActiveAt.getTime()).toBeLessThanOrEqual(Date.now());
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    throw new Error("lastActiveAt was not updated");
  });

  it("reads access token from the httpOnly cookie", async () => {
    const registered = await authService.register({
      email: "require-auth-cookie@example.com",
      password: "TestPass1!",
    });

    const request = new Request("http://localhost:3000/api/v1/users/me", {
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${registered.accessToken}`,
      },
    });

    const user = await requireAuthFromRequest(request);
    expect(user.id).toBe(registered.user.id);
  });

  it("rejects inactive users even when the access token has not expired", async () => {
    const registered = await authService.register({
      email: "require-auth-inactive@example.com",
      password: "TestPass1!",
    });

    await User.updateOne({ _id: registered.user.id }, { $set: { isActive: false } });

    const request = new Request("http://localhost:3000/api/v1/users/me", {
      headers: {
        Authorization: `Bearer ${registered.accessToken}`,
      },
    });

    await expect(requireAuthFromRequest(request)).rejects.toMatchObject({
      statusCode: 401,
      code: "UNAUTHORIZED",
    });
  });
});
