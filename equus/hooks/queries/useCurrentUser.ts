"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
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
