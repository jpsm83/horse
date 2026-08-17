/**
 * establishSession — token issuance after login, register, refresh, session bridge.
 */

import { describe, expect, it } from "vitest";
import User from "@/models/User.ts";
import { establishSession } from "@/lib/auth/establishSession.ts";
import * as authService from "@/lib/services/authService.ts";

describe("establishSession", () => {
  it("rejects inactive users before issuing tokens", async () => {
    const registered = await authService.register({
      email: "inactive-establish@example.com",
      password: "TestPass1!",
    });

    await User.updateOne({ _id: registered.user.id }, { $set: { isActive: false } });

    await expect(establishSession(registered.user.id)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
