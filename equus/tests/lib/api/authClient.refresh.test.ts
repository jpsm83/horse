import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCurrentUser, resetOptionalUserCache } from "@/lib/api/auth/session";
import { loginWithCredentials } from "@/lib/api/auth/credentials";

describe("apiFetch 401 refresh retry", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetOptionalUserCache();
    vi.restoreAllMocks();
  });

  it("retries protected requests after a successful refresh", async () => {
    let meCalls = 0;

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/refresh")) {
        return new Response(
          JSON.stringify({
            data: {
              accessToken: "new-access",
              refreshToken: "new-refresh",
              user: { id: "1", email: "user@example.com", type: "user" },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/v1/auth/me")) {
        meCalls += 1;
        if (meCalls === 1) {
          return new Response(
            JSON.stringify({
              error: { message: "Invalid or expired access token", code: "UNAUTHORIZED" },
            }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            data: { user: { id: "1", email: "user@example.com", type: "user" } },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const user = await fetchCurrentUser();

    expect(user.email).toBe("user@example.com");
    expect(meCalls).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("does not refresh on failed login", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/login")) {
        return new Response(
          JSON.stringify({
            error: { message: "Invalid credentials", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const { ApiClientError } = await import("@/lib/api/auth/session");

    await expect(
      loginWithCredentials("wrong@example.com", "WrongPass1!"),
    ).rejects.toBeInstanceOf(ApiClientError);

    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.anything(),
    );
  });
});
