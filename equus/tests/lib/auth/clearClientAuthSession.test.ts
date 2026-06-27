import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock, signOutMock, logoutFromApiMock, runWithSilentAuthFailureMock } =
  vi.hoisted(() => ({
    getSessionMock: vi.fn(),
    signOutMock: vi.fn(),
    logoutFromApiMock: vi.fn(),
    runWithSilentAuthFailureMock: vi.fn((fn: () => Promise<void>) => fn()),
  }));

vi.mock("next-auth/react", () => ({
  getSession: getSessionMock,
  signOut: signOutMock,
}));

vi.mock("@/lib/api/authClient.ts", () => ({
  logoutFromApi: logoutFromApiMock,
  runWithSilentAuthFailure: runWithSilentAuthFailureMock,
}));

import { clearClientAuthSession } from "@/lib/auth/clearClientAuthSession.ts";

describe("clearClientAuthSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logoutFromApiMock.mockResolvedValue(undefined);
    signOutMock.mockResolvedValue(undefined);
  });

  it("clears REST session and NextAuth when a session exists", async () => {
    getSessionMock.mockResolvedValue({ user: { id: "1" } });

    await clearClientAuthSession();

    expect(logoutFromApiMock).toHaveBeenCalledOnce();
    expect(signOutMock).toHaveBeenCalledWith({ redirect: false });
  });

  it("skips NextAuth signOut when no session exists", async () => {
    getSessionMock.mockResolvedValue(null);

    await clearClientAuthSession();

    expect(logoutFromApiMock).toHaveBeenCalledOnce();
    expect(signOutMock).not.toHaveBeenCalled();
  });
});
