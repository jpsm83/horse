"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { UserHubSectionsProjection } from "@/lib/users/userHubSections.ts";

async function fetchUserHub(userId: string): Promise<UserHubSectionsProjection> {
  const response = await fetchWithAuth(
    `/api/v1/users/${encodeURIComponent(userId)}/hub`,
  );
  const data = await parseApiResponse<{ sections: UserHubSectionsProjection }>(response);
  return data.sections;
}

export function useUserHub(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.hub(userId!),
    queryFn: () => fetchUserHub(userId!),
    enabled: !!userId,
  });
}
