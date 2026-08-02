/**
 * TanStack Query hooks for the notification inbox.
 *
 * `useNotifications(page)` reads the paginated notification list
 * (`GET /api/v1/notifications`). `useMarkNotificationRead` marks a single
 * notification read and invalidates the list caches.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { NotificationListResult } from "@/lib/services/notificationService";

async function fetchNotifications(page: number): Promise<NotificationListResult> {
  const response = await fetchWithAuth(`/api/v1/notifications?page=${page}&limit=20`);
  return parseApiResponse<NotificationListResult>(response);
}

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: queryKeys.notifications.list(page),
    queryFn: () => fetchNotifications(page),
    staleTime: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      fetchWithAuth(`/api/v1/notifications/${notificationId}/read`, {
        method: "PATCH",
      }).then((response) => parseApiResponse<{ success: boolean }>(response)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
