"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { updateUserProfile } from "@/lib/api/auth/profile";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicUser, UserViewDto } from "@/lib/services/userService";
import type { UpdatePersonalDetailsInput } from "@/lib/services/userService";
import type { UserOwnedNavigation } from "@/lib/services/navigationService";

async function fetchUserProfile(): Promise<PublicUser> {
  const response = await fetchWithAuth("/api/v1/users/me");
  const data = await parseApiResponse<{ user: PublicUser }>(response);
  return data.user;
}

async function fetchUserView(userId: string): Promise<UserViewDto> {
  const response = await fetchWithAuth("/api/v1/users/me");
  const data = await parseApiResponse<{ user: PublicUser }>(response);
  return { user: data.user, isOwner: true };
}

/** Owner user view — GET /api/v1/users/me. */
export function useUserView(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.view(userId),
    queryFn: () => fetchUserView(userId),
    staleTime: 60_000,
    enabled: !!userId,
  });
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

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, imageFile }: { input: UpdatePersonalDetailsInput; imageFile?: File }) =>
      updateUserProfile(input, imageFile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}

async function patchUserHubSection(
  userId: string,
  sectionKey: string,
  mode: string,
): Promise<PublicUser> {
  const response = await fetchWithAuth("/api/v1/users/me/hub-sections", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sectionKey, mode }),
  });
  const data = await parseApiResponse<{ user: PublicUser }>(response);
  return data.user;
}

/** Update a single hub section visibility mode. Invalidates view cache on success. */
export function useUpdateUserHubSection(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sectionKey, mode }: { sectionKey: string; mode: string }) =>
      patchUserHubSection(userId, sectionKey, mode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.view(userId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.me });
    },
  });
}

async function fetchNotificationPreferences(
  userId: string,
): Promise<{ email: Record<string, boolean> }> {
  const response = await fetchWithAuth("/api/v1/users/me/notifications");
  const data = await parseApiResponse<{ notificationPreferences: { email: Record<string, boolean> } }>(
    response,
  );
  return data.notificationPreferences;
}

async function patchNotificationPreferences(
  patch: Record<string, unknown>,
): Promise<{ email: Record<string, boolean> }> {
  const response = await fetchWithAuth("/api/v1/users/me/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await parseApiResponse<{ notificationPreferences: { email: Record<string, boolean> } }>(
    response,
  );
  return data.notificationPreferences;
}

export function useNotificationPreferences(userId: string) {
  return useQuery({
    queryKey: queryKeys.users.notifications(userId),
    queryFn: () => fetchNotificationPreferences(userId),
    staleTime: 60_000,
    enabled: !!userId,
  });
}

export function useUpdateNotificationPreferences(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: Record<string, unknown>) => patchNotificationPreferences(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.notifications(userId) });
    },
  });
}
