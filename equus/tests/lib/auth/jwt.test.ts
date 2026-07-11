import { describe, expect, it } from "vitest";

import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import {
  getAccessTokenFromRequest,
  getRefreshTokenFromRequest,
} from "@/lib/auth/jwt.ts";

describe("getAccessTokenFromRequest", () => {
  it("reads a bearer token from the Authorization header", () => {
    const request = new Request("http://localhost/api/v1/auth/me", {
      headers: { Authorization: "Bearer header-token" },
    });

    expect(getAccessTokenFromRequest(request)).toBe("header-token");
  });

  it("reads the access token from httpOnly cookie header", () => {
    const request = new Request("http://localhost/api/v1/auth/me", {
      headers: {
        cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=cookie-token; other=value`,
      },
    });

    expect(getAccessTokenFromRequest(request)).toBe("cookie-token");
  });

  it("prefers the Authorization header over cookies", () => {
    const request = new Request("http://localhost/api/v1/auth/me", {
      headers: {
        Authorization: "Bearer header-token",
        cookie: `${AUTH_CONFIG.ACCESS_COOKIE_NAME}=cookie-token`,
      },
    });

    expect(getAccessTokenFromRequest(request)).toBe("header-token");
  });
});

describe("getRefreshTokenFromRequest", () => {
  it("returns null when no cookies are present", () => {
    const request = new Request("http://localhost/api/v1/auth/me");

    expect(getRefreshTokenFromRequest(request)).toBeNull();
  });

  it("returns null when refresh token cookie is missing", () => {
    const request = new Request("http://localhost/api/v1/auth/me", {
      headers: { cookie: "other=value" },
    });

    expect(getRefreshTokenFromRequest(request)).toBeNull();
  });

  it("reads the refresh token from httpOnly cookie header", () => {
    const request = new Request("http://localhost/api/v1/auth/me", {
      headers: {
        cookie: `${AUTH_CONFIG.REFRESH_COOKIE_NAME}=refresh-token; other=value`,
      },
    });

    expect(getRefreshTokenFromRequest(request)).toBe("refresh-token");
  });
});
