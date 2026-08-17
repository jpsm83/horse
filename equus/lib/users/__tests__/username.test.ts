import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/errors.ts";
import * as userService from "@/lib/services/userService.ts";
import {
  assertUsernameAvailable,
  normalizeUsername,
} from "@/lib/users/username.ts";

describe("username helpers", () => {
  it("normalizeUsername trims and lowercases", () => {
    expect(normalizeUsername("  JaneRider  ")).toBe("janerider");
  });

  it("assertUsernameAvailable rejects a taken username", async () => {
    const first = await userService.createCredentialsUser({
      email: "username-first@example.com",
      password: "TestPass1!",
      username: "takenhandle",
    });

    await expect(assertUsernameAvailable("TakenHandle")).rejects.toMatchObject({
      statusCode: 409,
      code: "CONFLICT",
    });

    await expect(
      assertUsernameAvailable("takenhandle", String(first._id)),
    ).resolves.toBeUndefined();
  });
});
