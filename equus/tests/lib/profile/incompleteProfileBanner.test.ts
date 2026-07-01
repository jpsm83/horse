import { describe, expect, it } from "vitest";

import { shouldShowIncompleteProfileBanner } from "@/lib/profile/incompleteProfileBanner.ts";

describe("shouldShowIncompleteProfileBanner", () => {
  it("shows for authenticated users with incomplete profile off /profile", () => {
    expect(
      shouldShowIncompleteProfileBanner({
        pathname: "/",
        isAuthenticated: true,
        isLoading: false,
        profileComplete: false,
      }),
    ).toBe(true);
  });

  it("hides while auth is loading", () => {
    expect(
      shouldShowIncompleteProfileBanner({
        pathname: "/create/horse",
        isAuthenticated: true,
        isLoading: true,
        profileComplete: false,
      }),
    ).toBe(false);
  });

  it("hides when not authenticated", () => {
    expect(
      shouldShowIncompleteProfileBanner({
        pathname: "/",
        isAuthenticated: false,
        isLoading: false,
        profileComplete: false,
      }),
    ).toBe(false);
  });

  it("hides when profile is complete", () => {
    expect(
      shouldShowIncompleteProfileBanner({
        pathname: "/create/horse",
        isAuthenticated: true,
        isLoading: false,
        profileComplete: true,
      }),
    ).toBe(false);
  });

  it("hides on /profile to avoid duplicate banner", () => {
    expect(
      shouldShowIncompleteProfileBanner({
        pathname: "/profile",
        isAuthenticated: true,
        isLoading: false,
        profileComplete: false,
      }),
    ).toBe(false);
  });
});
