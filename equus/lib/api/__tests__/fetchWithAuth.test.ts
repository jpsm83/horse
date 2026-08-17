import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchWithAuth } from "@/lib/api/fetchWithAuth.ts";
import { shouldAttemptTokenRefresh } from "@/lib/api/auth/session.ts";

describe("shouldAttemptTokenRefresh", () => {
  it("returns false for auth endpoints", () => {
    expect(shouldAttemptTokenRefresh("/api/v1/auth/login")).toBe(false);
    expect(shouldAttemptTokenRefresh("/api/v1/auth/register")).toBe(false);
    expect(shouldAttemptTokenRefresh("/api/v1/auth/logout")).toBe(false);
    expect(shouldAttemptTokenRefresh("/api/v1/auth/refresh")).toBe(false);
    expect(shouldAttemptTokenRefresh("/api/v1/auth/session")).toBe(false);
    expect(shouldAttemptTokenRefresh("/api/v1/auth/me")).toBe(false);
  });

  it("returns true for protected API routes", () => {
    expect(shouldAttemptTokenRefresh("/api/v1/horses")).toBe(true);
    expect(shouldAttemptTokenRefresh("/api/v1/users/me")).toBe(true);
  });
});

describe("fetchWithAuth 401 retry", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("retries a protected request once after refresh succeeds", async () => {
    let horseCalls = 0;

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url.includes("/api/v1/horses") && init?.method !== "POST") {
        horseCalls += 1;
        if (horseCalls === 1) {
          return new Response(null, { status: 401 });
        }
        return new Response(JSON.stringify({ data: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

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

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const response = await fetchWithAuth("/api/v1/horses");
    expect(response.status).toBe(200);
    expect(horseCalls).toBe(2);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("does not call refresh when login returns 401", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/auth/login")) {
        return new Response(null, { status: 401 });
      }
      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const response = await fetchWithAuth("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "x" }),
    });

    expect(response.status).toBe(401);
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.anything(),
    );
  });
});
