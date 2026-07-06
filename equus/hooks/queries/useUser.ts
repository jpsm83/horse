"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicUserProfileCard } from "@/lib/privacy/userPublicProfile";

async function fetchPublicUser(userId: string): Promise<PublicUserProfileCard> {
  const response = await fetchWithAuth(`/api/v1/users/${encodeURIComponent(userId)}`);
  const data = await parseApiResponse<{ user: PublicUserProfileCard }>(response);
  return data.user;
}

export function usePublicUser(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.users.detail(userId!),
    queryFn: () => fetchPublicUser(userId!),
    enabled: !!userId,
  });
}
