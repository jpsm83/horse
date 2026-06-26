import { describe, expect, it } from "vitest";

import { AUTH_CONFIG } from "@/lib/auth/config.ts";
import { getAccessTokenFromRequest } from "@/lib/auth/jwt.ts";

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
