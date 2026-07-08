/**
 * Thin re-exports from session.ts for use by fetchWithAuth.ts.
 * Breaks the circular dependency: fetchWithAuth → fetch-auth → session
 * (session never imports fetchWithAuth — it uses raw fetch internally).
 */
export {
  refreshAccessToken,
  shouldAttemptTokenRefresh,
  resetOptionalUserCache,
  notifySessionExpired,
  ApiClientError,
  isApiClientError,
} from "@/lib/api/auth/session";
