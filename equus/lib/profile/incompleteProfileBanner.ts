/**
 * When to show the global incomplete-profile banner in `AppShell`.
 *
 * Hidden on `/profile` (that page has its own banner) and while auth is loading.
 */

export type IncompleteProfileBannerContext = {
  pathname: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileComplete?: boolean;
};

/** Matches `h-14` on the global incomplete-profile banner. */
export const INCOMPLETE_PROFILE_BANNER_HEIGHT = "3.5rem";

export function shouldShowIncompleteProfileBanner(
  context: IncompleteProfileBannerContext,
): boolean {
  if (context.isLoading || !context.isAuthenticated) {
    return false;
  }

  if (context.profileComplete === true) {
    return false;
  }

  return context.pathname !== "/profile";
}
