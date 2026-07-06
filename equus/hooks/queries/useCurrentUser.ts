"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { resetOptionalUserCache } from "@/lib/api/authClient";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicUser } from "@/lib/services/userService";
import type { UserOwnedNavigation } from "@/lib/services/navigationService";

async function fetchUserProfile(): Promise<PublicUser> {
  const response = await fetchWithAuth("/api/v1/users/me");
  const data = await parseApiResponse<{ user: PublicUser }>(response);
  return data.user;
}

async function fetchUserNavigation(): Promise<UserOwnedNavigation> {
  const response = await fetchWithAuth("/api/v1/users/me/navigation");
  const data = await parseApiResponse<{ owned: UserOwnedNavigation }>(response);
  return data.owned;
}

export function useUserProfile(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.me,
    queryFn: fetchUserProfile,
    staleTime: 60_000,
    enabled,
  });
}

export function useUserNavigation(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.navigation,
    queryFn: fetchUserNavigation,
    staleTime: 60_000,
    enabled,
  });
}

/**
 * Invalidate current user data across both authClient and TanStack caches.
 * Triggers authClient to re-probe /api/v1/auth/me and refetch profile/navigation.
 */
export function useInvalidateCurrentUser() {
  const queryClient = useQueryClient();
  return () => {
    resetOptionalUserCache();
    queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    queryClient.invalidateQueries({ queryKey: queryKeys.users.navigation });
  };
}
