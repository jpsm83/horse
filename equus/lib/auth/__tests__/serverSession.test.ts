import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const verifyAccessTokenMock = vi.fn();
const verifyRefreshTokenMock = vi.fn();
const assertUserAccountActiveMock = vi.fn();
const readRefreshSessionVersionForUserMock = vi.fn();
const refreshTokenPayloadVersionMatchesDbMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: () => cookiesMock(),
}));

vi.mock("@/lib/auth/jwt.ts", () => ({
  verifyAccessToken: (...args: unknown[]) => verifyAccessTokenMock(...args),
  verifyRefreshToken: (...args: unknown[]) => verifyRefreshTokenMock(...args),
}));

vi.mock("@/lib/auth/session.ts", () => ({
  assertUserAccountActive: (...args: unknown[]) => assertUserAccountActiveMock(...args),
  readRefreshSessionVersionForUser: (...args: unknown[]) =>
    readRefreshSessionVersionForUserMock(...args),
  refreshTokenPayloadVersionMatchesDb: (...args: unknown[]) =>
    refreshTokenPayloadVersionMatchesDbMock(...args),
}));

vi.mock("@/lib/auth/config.ts", () => ({
  AUTH_CONFIG: {
    ACCESS_COOKIE_NAME: "access_token",
    REFRESH_COOKIE_NAME: "refresh_token",
  },
}));

describe("getServerUserId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertUserAccountActiveMock.mockResolvedValue(undefined);
    refreshTokenPayloadVersionMatchesDbMock.mockReturnValue(true);
  });

  it("returns user id from a valid access token", async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) =>
        name === "access_token" ? { value: "access" } : undefined,
    });
    verifyAccessTokenMock.mockResolvedValue({ id: "user-1" });

    const { getServerUserId } = await import("@/lib/auth/serverSession.ts");
    await expect(getServerUserId()).resolves.toBe("user-1");
    expect(verifyRefreshTokenMock).not.toHaveBeenCalled();
  });

  it("falls back to refresh cookie when access token is expired", async () => {
    cookiesMock.mockResolvedValue({
      get: (name: string) => {
        if (name === "access_token") return { value: "expired" };
        if (name === "refresh_token") return { value: "refresh" };
        return undefined;
      },
    });
    verifyAccessTokenMock.mockRejectedValue(new Error("expired"));
    verifyRefreshTokenMock.mockResolvedValue({ id: "user-2", v: 1 });
    readRefreshSessionVersionForUserMock.mockResolvedValue(1);

    const { getServerUserId } = await import("@/lib/auth/serverSession.ts");
    await expect(getServerUserId()).resolves.toBe("user-2");
  });

  it("returns null when both tokens are missing", async () => {
    cookiesMock.mockResolvedValue({
      get: () => undefined,
    });

    const { getServerUserId } = await import("@/lib/auth/serverSession.ts");
    await expect(getServerUserId()).resolves.toBeNull();
  });
});
