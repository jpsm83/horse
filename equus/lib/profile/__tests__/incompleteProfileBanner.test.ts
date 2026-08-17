import { describe, expect, it } from "vitest";

import { shouldShowIncompleteProfileBanner } from "@/lib/profile/incompleteProfileBanner.ts";

describe("shouldShowIncompleteProfileBanner", () => {
  it("shows for authenticated users with incomplete profile off account pages", () => {
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
        pathname: "/horses/new",
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
        pathname: "/horses/new",
        isAuthenticated: true,
        isLoading: false,
        profileComplete: true,
      }),
    ).toBe(false);
  });

  it("hides on legacy /profile to avoid duplicate banner", () => {
    expect(
      shouldShowIncompleteProfileBanner({
        pathname: "/profile",
        isAuthenticated: true,
        isLoading: false,
        profileComplete: false,
      }),
    ).toBe(false);
  });

  it("hides on /user/[id]/profile and preferences", () => {
    expect(
      shouldShowIncompleteProfileBanner({
        pathname: "/user/abc123/profile",
        isAuthenticated: true,
        isLoading: false,
        profileComplete: false,
      }),
    ).toBe(false);
    expect(
      shouldShowIncompleteProfileBanner({
        pathname: "/user/abc123/preferences",
        isAuthenticated: true,
        isLoading: false,
        profileComplete: false,
      }),
    ).toBe(false);
  });
});
