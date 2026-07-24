/**
 * TanStack Query hook — search Equus users by username, email, first/last name.
 * Calls `GET /api/v1/users/search?q=`.
 */

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import type { UserSearchResult } from "@/lib/services/userService.ts";

export type { UserSearchResult };

async function fetchUserSearch(query: string): Promise<UserSearchResult[]> {
  const response = await fetchWithAuth(
    `/api/v1/users/search?q=${encodeURIComponent(query.trim())}`,
  );
  const data = await parseApiResponse<{ results: UserSearchResult[] }>(response);
  return data.results ?? [];
}

export function useUserSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.users(query),
    queryFn: () => fetchUserSearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
