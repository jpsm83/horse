import { describe, expect, it } from "vitest";

import { buildStatusPageActions } from "@/lib/navigation/statusPageActions.ts";
import {
  GUEST_LANDING_PATH,
  USER_HOME_PATH,
} from "@/lib/navigation/postAuthRedirect.ts";

const labels = {
  guestHome: "Go home",
  userHome: "Home",
  signIn: "Sign in",
};

describe("buildStatusPageActions", () => {
  it("shows guest home and sign in for anonymous visitors", () => {
    expect(buildStatusPageActions({ isAuthenticated: false, labels })).toEqual([
      { label: "Go home", href: GUEST_LANDING_PATH },
      { label: "Sign in", href: "/signin", variant: "outline" },
    ]);
  });

  it("shows only user home when signed in", () => {
    expect(buildStatusPageActions({ isAuthenticated: true, labels })).toEqual([
      { label: "Home", href: USER_HOME_PATH },
    ]);
  });
});
