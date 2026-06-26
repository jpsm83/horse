import { describe, expect, it } from "vitest";

import { establishSession } from "@/lib/auth/establishSession.ts";
import { verifyAccessToken } from "@/lib/auth/jwt.ts";
import * as authService from "@/lib/services/authService.ts";

describe("establishSession", () => {
  it("issues tokens for a registered user", async () => {
    const registered = await authService.register({
      email: "establish@example.com",
      password: "TestPass1!",
    });

    const tokens = await establishSession(registered.user.id);

    expect(tokens.user.email).toBe("establish@example.com");
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();

    const payload = await verifyAccessToken(tokens.accessToken);
    expect(payload.id).toBe(registered.user.id);
  });
});
