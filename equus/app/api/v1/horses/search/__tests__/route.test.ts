import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db.ts", () => ({ default: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/auth/requireAuth.ts", () => ({
  requireAuthFromRequest: vi.fn().mockResolvedValue({ id: "user1", email: "a@b.com" }),
}));

const findMock = vi.fn();
vi.mock("@/models/Horse.ts", () => ({
  default: { find: (...args: unknown[]) => findMock(...args) },
}));
vi.mock("@/models/User.ts", () => ({
  default: { find: vi.fn().mockReturnValue({ select: () => ({ lean: async () => [] }) }) },
}));

import { GET } from "@/app/api/v1/horses/search/route.ts";

describe("GET /api/v1/horses/search", () => {
  beforeEach(() => {
    findMock.mockReset();
    findMock.mockReturnValue({
      select: () => ({
        limit: () => ({
          lean: async () => [],
        }),
      }),
    });
  });

  it("returns empty when query normalizes to empty", async () => {
    const res = await GET(new Request("http://localhost/api/v1/horses/search?q=---"));
    const body = await res.json();
    expect(body.data.results).toEqual([]);
    expect(findMock).not.toHaveBeenCalled();
  });

  it("queries exact normalized identity fields", async () => {
    await GET(new Request("http://localhost/api/v1/horses/search?q=MC-%20123"));
    expect(findMock).toHaveBeenCalledWith(
      expect.objectContaining({
        $or: [{ registryId: "mc123" }, { microchipId: "mc123" }, { passportNumber: "mc123" }],
      }),
    );
  });
});
