/**
 * Shared fetch utility for TanStack Query hooks and auth-adjacent operations.
 * Handles cookie auth, token refresh, and consistent JSON parsing.
 * All client-side data fetching goes through this.
 *
 * Token refresh delegates to the auth session module to share a single refreshInFlight.
 */

import {
  refreshAccessToken,
  shouldAttemptTokenRefresh,
  resetOptionalUserCache,
  notifySessionExpired,
  ApiClientError,
  isApiClientError,
} from "@/lib/api/auth/fetch-auth";

import { parseApiResponse } from "@/lib/api/parseApiResponse";

export { isApiClientError as isFetchError, ApiClientError as FetchError };
export { parseApiResponse };

export async function fetchWithAuth(
  input: string,
  init?: RequestInit,
  options?: { notifyOnExpired?: boolean },
): Promise<Response> {
  let response = await fetch(input, { ...init, credentials: "include" });

  if (response.status === 401 && shouldAttemptTokenRefresh(input)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(input, { ...init, credentials: "include" });
    } else if (options?.notifyOnExpired) {
      resetOptionalUserCache();
      notifySessionExpired();
    }
  }

  return response;
}
