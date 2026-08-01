/**
 * Redirect the browser to an external (or arbitrary) URL by navigating the
 * current window. Extracted into a plain module so the React Compiler doesn't
 * analyze the global mutation — there is no declarative alternative for
 * navigating the browser to an external URL (e.g. Stripe checkout / portal).
 */

export function redirectToExternal(url: string): void {
  window.location.assign(url);
}
