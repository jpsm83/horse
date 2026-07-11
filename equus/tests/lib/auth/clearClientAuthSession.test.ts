import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, signOutMock, logoutFromApiMock, runWithSilentAuthFailureMock, runWithSuppressedSessionExpiredMock, resetOptionalUserCacheMock } =
  vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    signOutMock: vi.fn(),
    logoutFromApiMock: vi.fn(),
    runWithSilentAuthFailureMock: vi.fn((fn: () => Promise<void>) => fn()),
    runWithSuppressedSessionExpiredMock: vi.fn((fn: () => Promise<void>) => fn()),
    resetOptionalUserCacheMock: vi.fn(),
  }));

vi.mock("next-auth/react", () => ({
  getSession: getSessionMock,
  signOut: signOutMock,
}));

vi.mock("@/lib/api/auth/session", () => ({
  logoutFromApi: logoutFromApiMock,
  resetOptionalUserCache: resetOptionalUserCacheMock,
  runWithSilentAuthFailure: runWithSilentAuthFailureMock,
  runWithSuppressedSessionExpired: runWithSuppressedSessionExpiredMock,
}));

import { clearClientAuthSession } from "@/lib/auth/clearClientAuthSession.ts";

describe("clearClientAuthSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logoutFromApiMock.mockResolvedValue(undefined);
    signOutMock.mockResolvedValue(undefined);
  });

  it("clears NextAuth before REST logout when a session exists", async () => {
    const callOrder: string[] = [];
    getSessionMock.mockResolvedValue({ user: { id: "1" } });
    signOutMock.mockImplementation(async () => {
      callOrder.push("signOut");
    });
    logoutFromApiMock.mockImplementation(async () => {
      callOrder.push("logout");
    });

    await clearClientAuthSession();

    expect(callOrder).toEqual(["signOut", "logout"]);
    expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
    expect(runWithSuppressedSessionExpiredMock).toHaveBeenCalledOnce();
    expect(resetOptionalUserCacheMock).toHaveBeenCalledOnce();
  });

  it("skips NextAuth signOut when no session exists", async () => {
    getSessionMock.mockResolvedValue(null);

    await clearClientAuthSession();

    expect(logoutFromApiMock).toHaveBeenCalledOnce();
    expect(signOutMock).not.toHaveBeenCalled();
    expect(resetOptionalUserCacheMock).toHaveBeenCalledOnce();
  });
});
