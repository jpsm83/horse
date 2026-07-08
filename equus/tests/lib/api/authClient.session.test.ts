import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ensureRestSession,
  resetOptionalUserCache,
  runWithSuppressedSessionExpired,
  setSessionExpiredHandler,
  subscribeAuthStateChanged,
} from "@/lib/api/auth/session";
import { loginWithCredentials } from "@/lib/api/auth/credentials";

describe("ensureRestSession", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetOptionalUserCache();
    setSessionExpiredHandler(null);
    vi.restoreAllMocks();
  });

  it("returns user without bridge when REST session is valid", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({
            data: { user: { id: "1", email: "user@example.com", type: "user" } },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const user = await ensureRestSession({ nextAuthUserId: "1" });

    expect(user?.email).toBe("user@example.com");
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "/api/v1/auth/session",
      expect.anything(),
    );
  });

  it("bridges from NextAuth when REST session is missing", async () => {
    let meCalls = 0;

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/session")) {
        return new Response(
          JSON.stringify({
            data: {
              accessToken: "access",
              refreshToken: "refresh",
              user: { id: "google-1", email: "google@example.com", type: "user" },
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
              error: { message: "No access token provided", code: "UNAUTHORIZED" },
            }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({
            data: { user: { id: "google-1", email: "google@example.com", type: "user" } },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const user = await ensureRestSession({ nextAuthUserId: "google-1" });

    expect(user?.email).toBe("google@example.com");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/v1/auth/session",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("bridges when attemptBridge is set without NextAuth user id", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/session")) {
        return new Response(
          JSON.stringify({
            data: {
              accessToken: "access",
              refreshToken: "refresh",
              user: { id: "google-1", email: "google@example.com", type: "user" },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({
            error: { message: "No access token provided", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const user = await ensureRestSession({ attemptBridge: true });

    expect(user?.email).toBe("google@example.com");
  });

  it("does not bridge when there is no NextAuth user id", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({
            error: { message: "No access token provided", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const expiredHandler = vi.fn();
    setSessionExpiredHandler(expiredHandler);

    const user = await ensureRestSession();

    expect(user).toBeNull();
    expect(expiredHandler).not.toHaveBeenCalled();
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "/api/v1/auth/session",
      expect.anything(),
    );
  });

  it("notifies session expired when required session cannot be established", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({
            error: { message: "No access token provided", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/v1/auth/session")) {
        return new Response(
          JSON.stringify({
            error: { message: "Not authenticated", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const expiredHandler = vi.fn();
    setSessionExpiredHandler(expiredHandler);

    const user = await ensureRestSession({ nextAuthUserId: "google-1", required: true });

    expect(user).toBeNull();
    expect(expiredHandler).toHaveBeenCalledTimes(1);
  });

  it("does not notify session expired when optional bridge fails", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({
            error: { message: "No access token provided", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/v1/auth/session")) {
        return new Response(
          JSON.stringify({
            error: { message: "Not authenticated", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const expiredHandler = vi.fn();
    setSessionExpiredHandler(expiredHandler);

    const user = await ensureRestSession({ nextAuthUserId: "google-1" });

    expect(user).toBeNull();
    expect(expiredHandler).not.toHaveBeenCalled();
  });

  it("caches anonymous result and dedupes concurrent probes", async () => {
    let meCalls = 0;

    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/auth/me")) {
        meCalls += 1;
        return new Response(
          JSON.stringify({
            error: { message: "No access token provided", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const [first, second] = await Promise.all([
      ensureRestSession(),
      ensureRestSession(),
    ]);

    expect(first).toBeNull();
    expect(second).toBeNull();
    expect(meCalls).toBe(1);
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.anything(),
    );
  });

  it("skips refresh when no access token cookie is present", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({
            error: { message: "No access token provided", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(null, { status: 404 });
    }) as typeof fetch;

    await ensureRestSession();

    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "/api/v1/auth/refresh",
      expect.anything(),
    );
  });
});

describe("subscribeAuthStateChanged", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetOptionalUserCache();
    vi.restoreAllMocks();
  });

  it("notifies when credentials login establishes a REST session", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/login")) {
        return new Response(
          JSON.stringify({
            data: {
              accessToken: "access",
              refreshToken: "refresh",
              user: { id: "1", email: "user@example.com", type: "user" },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const listener = vi.fn();
    const unsubscribe = subscribeAuthStateChanged(listener);

    await loginWithCredentials("user@example.com", "secret");

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    resetOptionalUserCache();
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("does not notify when ensureRestSession refreshes the same cached user", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({
            data: { user: { id: "1", email: "user@example.com", type: "user" } },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const listener = vi.fn();
    const unsubscribe = subscribeAuthStateChanged(listener);

    await ensureRestSession();
    listener.mockClear();

    await ensureRestSession();

    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });
});

describe("runWithSuppressedSessionExpired", () => {
  afterEach(() => {
    resetOptionalUserCache();
    setSessionExpiredHandler(null);
    vi.restoreAllMocks();
  });

  it("suppresses session-expired notification during intentional sign-out", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes("/api/v1/auth/me")) {
        return new Response(
          JSON.stringify({
            error: { message: "No access token provided", code: "UNAUTHORIZED" },
          }),
          { status: 401, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(null, { status: 404 });
    }) as typeof fetch;

    const expiredHandler = vi.fn();
    setSessionExpiredHandler(expiredHandler);

    await runWithSuppressedSessionExpired(() =>
      ensureRestSession({ nextAuthUserId: "google-1", required: true }),
    );

    expect(expiredHandler).not.toHaveBeenCalled();
    globalThis.fetch = originalFetch;
  });
});
