/**
 * Post-auth navigation — safe in-app redirects after sign-in and sign-up.
 */

/** Signed-in user's personal home hub (dashboard, quick actions, owned subsections). */
export const USER_HOME_PATH = "/home";

/** Account settings — personal details, preferences, deactivation. */
export const PROFILE_SETTINGS_PATH = "/profile";

/** Default destination after sign-in, sign-up, or Google OAuth. */
export const DEFAULT_POST_AUTH_PATH = USER_HOME_PATH;

/** Public marketing landing for visitors and after sign-out. */
export const GUEST_LANDING_PATH = "/";

/** App home link target — `/home` when signed in, `/` for guests. */
export function resolveAppHomePath(isAuthenticated: boolean): string {
  return isAuthenticated ? USER_HOME_PATH : GUEST_LANDING_PATH;
}

/**
 * Resolve a safe internal path from the `next` search param (open-redirect safe).
 */
export function resolvePostAuthPath(next: string | null | undefined): string {
  if (!next?.trim()) {
    return DEFAULT_POST_AUTH_PATH;
  }

  const value = next.trim();

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  if (value.startsWith("/signin") || value.startsWith("/signup")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  // Guest landing is not a signed-in destination — avoid sign-in → / → /home bounce.
  if (value === "/" || value === GUEST_LANDING_PATH) {
    return DEFAULT_POST_AUTH_PATH;
  }

  // Legacy web route — `/me` was renamed to `/home`.
  if (value === "/me") {
    return DEFAULT_POST_AUTH_PATH;
  }

  return value;
}

/**
 * Sign-in URL for auth gates — omits `?next=` when the destination is already the default (`/home`).
 */
export function buildSignInPath(next?: string | null): string {
  const destination = resolvePostAuthPath(next);
  if (destination === DEFAULT_POST_AUTH_PATH) {
    return "/signin";
  }
  return `/signin?next=${encodeURIComponent(destination)}`;
}
