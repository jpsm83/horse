/**
 * touchUserLastActiveAt — throttled lastActiveAt persistence (UA-25).
 */

import { describe, expect, it } from "vitest";
import User from "@/models/User.ts";
import * as userService from "@/lib/services/userService.ts";
import {
  LAST_ACTIVE_TOUCH_INTERVAL_MS,
  touchUserLastActiveAt,
} from "@/lib/auth/touchUserLastActive.ts";

async function waitForLastActiveWrite(userId: string): Promise<Date | undefined> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const user = await User.findById(userId).select("lastActiveAt").lean();
    if (user?.lastActiveAt instanceof Date) {
      return user.lastActiveAt;
    }
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return undefined;
}

describe("touchUserLastActiveAt", () => {
  it("sets lastActiveAt when missing", async () => {
    const user = await userService.createCredentialsUser({
      email: "touch-missing@example.com",
      password: "TestPass1!",
    });

    touchUserLastActiveAt(String(user._id));
    const lastActiveAt = await waitForLastActiveWrite(String(user._id));

    expect(lastActiveAt).toBeInstanceOf(Date);
  });

  it("skips writes inside the throttle window", async () => {
    const user = await userService.createCredentialsUser({
      email: "touch-throttle@example.com",
      password: "TestPass1!",
    });
    const recent = new Date();

    await User.updateOne({ _id: user._id }, { $set: { lastActiveAt: recent } });

    touchUserLastActiveAt(String(user._id));
    await new Promise((resolve) => setTimeout(resolve, 50));

    const reloaded = await User.findById(user._id).select("lastActiveAt").lean();
    expect(reloaded?.lastActiveAt?.getTime()).toBe(recent.getTime());
  });

  it("updates when lastActiveAt is older than the throttle interval", async () => {
    const user = await userService.createCredentialsUser({
      email: "touch-stale@example.com",
      password: "TestPass1!",
    });
    const stale = new Date(Date.now() - LAST_ACTIVE_TOUCH_INTERVAL_MS - 1_000);

    await User.updateOne({ _id: user._id }, { $set: { lastActiveAt: stale } });

    touchUserLastActiveAt(String(user._id));

    for (let attempt = 0; attempt < 20; attempt += 1) {
      const reloaded = await User.findById(user._id).select("lastActiveAt").lean();
      if (
        reloaded?.lastActiveAt instanceof Date &&
        reloaded.lastActiveAt.getTime() > stale.getTime()
      ) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }

    throw new Error("lastActiveAt was not refreshed after throttle interval");
  });
});
