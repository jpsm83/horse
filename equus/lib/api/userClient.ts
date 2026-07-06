/**
 * @deprecated Use TanStack Query hooks from `hooks/queries/useUser.ts` instead.
 * Kept for backward compatibility during migration.
 */

import { isApiClientError } from "@/lib/api/authClient.ts";
import type { PublicUserProfileCard } from "@/lib/privacy/userPublicProfile.ts";
import { fetchWithAuth, parseApiResponse, FetchError } from "@/lib/api/fetchWithAuth";

export { isApiClientError };

async function apiFetchCatch(input: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetchWithAuth(input, init);
  } catch (err) {
    if (err instanceof FetchError) {
      // Convert to ApiClientError for callers that catch it
      const { ApiClientError } = await import("@/lib/api/authClient.ts");
      throw new ApiClientError(err.statusCode, err.message, err.code);
    }
    throw err;
  }
}

/** Load a visibility-filtered user card for entity-linked profile pages. */
export async function fetchPublicUserProfile(userId: string): Promise<PublicUserProfileCard> {
  const response = await apiFetchCatch(`/api/v1/users/${encodeURIComponent(userId)}`);
  const data = await parseApiResponse<{ user: PublicUserProfileCard }>(response);
  return data.user;
}

export type { PublicUserProfileCard };
