import { afterEach, describe, expect, it, vi } from "vitest";

describe("AUTH_CONFIG env", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("uses AUTH_URL as the app base URL", async () => {
    process.env.AUTH_URL = "https://app.example.com";
    delete process.env.NEXTAUTH_URL;

    const { AUTH_CONFIG } = await import("@/lib/auth/config.ts");
    expect(AUTH_CONFIG.APP_URL).toBe("https://app.example.com");
    expect(process.env.NEXTAUTH_URL).toBe("https://app.example.com");
  });

  it("falls back to NEXTAUTH_URL when AUTH_URL is unset", async () => {
    delete process.env.AUTH_URL;
    process.env.NEXTAUTH_URL = "https://legacy.example.com";

    const { AUTH_CONFIG } = await import("@/lib/auth/config.ts");
    expect(AUTH_CONFIG.APP_URL).toBe("https://legacy.example.com");
  });
});
