import { afterEach, describe, expect, it, vi } from "vitest";

import {
  acceptOwnershipTransfer,
  declineOwnershipTransfer,
  fetchPendingOwnershipTransfers,
  loginWithCredentials,
  resetOptionalUserCache,
} from "@/lib/api/authClient.ts";

describe("ownership transfer authClient", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    resetOptionalUserCache();
    vi.restoreAllMocks();
  });

  it("fetches pending ownership transfers for the current user", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/api/v1/auth/login") && method === "POST") {
        return new Response(
          JSON.stringify({
            data: {
              accessToken: "access",
              refreshToken: "refresh",
              user: { id: "user-1", email: "buyer@example.com", type: "user" },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/v1/users/me/ownership-transfers")) {
        return new Response(
          JSON.stringify({
            data: {
              transfers: [
                {
                  id: "transfer-1",
                  entityType: "horse",
                  entityId: "horse-1",
                  entityName: "Star",
                  transferKind: "transfer_main",
                  status: "pending",
                  initiatorUserId: "owner-1",
                  initiatorLabel: "Jane Owner",
                },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ error: { message: "Unexpected", code: "TEST" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    });

    globalThis.fetch = fetchMock;

    await loginWithCredentials("buyer@example.com", "TestPass1!");
    const transfers = await fetchPendingOwnershipTransfers();

    expect(transfers).toHaveLength(1);
    expect(transfers[0]?.transferKind).toBe("transfer_main");
    expect(transfers[0]?.initiatorLabel).toBe("Jane Owner");
  });

  it("accepts and declines ownership transfers via PATCH", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url.includes("/api/v1/auth/login") && method === "POST") {
        return new Response(
          JSON.stringify({
            data: {
              accessToken: "access",
              refreshToken: "refresh",
              user: { id: "user-1", email: "buyer@example.com", type: "user" },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.includes("/api/v1/ownership-transfers/transfer-1") && method === "PATCH") {
        const body = JSON.parse(String(init?.body));
        return new Response(
          JSON.stringify({
            data: {
              transfer: {
                id: "transfer-1",
                status: body.status,
                entityType: "horse",
                entityId: "horse-1",
                transferKind: "transfer_main",
                initiatorUserId: "owner-1",
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ error: { message: "Unexpected", code: "TEST" } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    });

    globalThis.fetch = fetchMock;

    await loginWithCredentials("buyer@example.com", "TestPass1!");
    await acceptOwnershipTransfer("transfer-1");
    await declineOwnershipTransfer("transfer-1");

    const patchCalls = fetchMock.mock.calls.filter(
      ([input, init]) =>
        String(input).includes("/api/v1/ownership-transfers/transfer-1") &&
        init?.method === "PATCH",
    );

    expect(patchCalls).toHaveLength(2);
    expect(JSON.parse(String(patchCalls[0]?.[1]?.body)).status).toBe("accepted");
    expect(JSON.parse(String(patchCalls[1]?.[1]?.body)).status).toBe("declined");
  });
});
