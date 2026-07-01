/**
 * DELETE /api/v1/users/me — account deactivation clears REST session cookies.
 */

import { describe, expect, it } from "vitest";
import { DELETE } from "@/app/api/v1/users/me/route.ts";
import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import * as authService from "@/lib/services/authService.ts";

describe("DELETE /api/v1/users/me", () => {
  it("soft-deletes the account and clears auth cookies", async () => {
    const registered = await authService.register({
      email: "delete-me@example.com",
      password: "TestPass1!",
    });

    const request = new Request("http://localhost:3000/api/v1/users/me", {
      method: "DELETE",
      headers: {
        Cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=${registered.accessToken}; ${AUTH_CONFIG.REFRESH_COOKIE_NAME}=${registered.refreshToken}`,
      },
    });

    const response = await DELETE(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.data.user.isActive).toBe(false);

    expect(response.cookies.get(AUTH_CONFIG.ACCESS_COOKIE_NAME)?.value).toBe("");
    expect(response.cookies.get(AUTH_CONFIG.REFRESH_COOKIE_NAME)?.value).toBe("");

    await expect(authService.refresh(registered.refreshToken)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
