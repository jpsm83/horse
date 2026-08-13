import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    toString: (): string => "access_token=test-access",
  })),
}));

vi.mock("@/lib/auth/config.ts", () => ({
  AUTH_CONFIG: { APP_URL: "http://localhost:3000" },
}));

describe("fetchApiJson", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns data from the REST envelope and forwards cookies", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { horse: { name: "Ada" } } }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchApiJson } = await import("@/lib/seo/fetchApiJson.ts");
    await expect(fetchApiJson("/api/v1/horses/abc")).resolves.toEqual({
      horse: { name: "Ada" },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/v1/horses/abc",
      expect.objectContaining({
        cache: "no-store",
        headers: { cookie: "access_token=test-access" },
      }),
    );
  });

  it("returns null when the API is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, json: async () => ({}) })),
    );
    const { fetchApiJson } = await import("@/lib/seo/fetchApiJson.ts");
    await expect(fetchApiJson("/api/v1/horses/missing")).resolves.toBeNull();
  });
});
