import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deactivateCurrentUserAccount,
  loginWithCredentials,
  resetOptionalUserCache,
  subscribeAuthStateChanged,
  tryFetchCurrentUser,
} from "@/lib/api/authClient.ts";

describe("deactivateCurrentUserAccount", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetOptionalUserCache();
    vi.restoreAllMocks();
  });

  it("calls DELETE /api/v1/users/me and clears the auth cache", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/api/v1/auth/login") && method === "POST") {
        return new Response(
          JSON.stringify({
            data: {
              accessToken: "access",
              refreshToken: "refresh",
              user: { id: "user-1", email: "deactivate@example.com", type: "user" },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/v1/auth/me")) {
        return new Response(JSON.stringify({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.includes("/api/v1/users/me") && method === "DELETE") {
        return new Response(
          JSON.stringify({
            data: {
              user: {
                id: "user-1",
                isActive: false,
                personalDetails: { email: "deactivate@example.com" },
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ error: { message: "Unexpected", code: "TEST" } }), {
        status: 500,
      });
    });

    globalThis.fetch = fetchMock;

    await loginWithCredentials("deactivate@example.com", "TestPass1!");
    expect(await tryFetchCurrentUser()).not.toBeNull();

    const listener = vi.fn();
    const unsubscribe = subscribeAuthStateChanged(listener);

    const result = await deactivateCurrentUserAccount();

    expect(result.user.isActive).toBe(false);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/users/me",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
    expect(await tryFetchCurrentUser()).toBeNull();
    expect(listener).toHaveBeenCalled();

    unsubscribe();
  });
});
