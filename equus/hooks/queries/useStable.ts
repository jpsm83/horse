/**
 * TanStack Query hooks for stables.
 *
 * `useStableView(stableId)` calls `GET /api/v1/stables/:id`. `useStableList` reads
 * the authenticated user's owned stables. `useCreateStable` creates a stable and
 * invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateStableInput,
  StableListFilters,
  StableListResult,
  StableViewResponse,
} from "@/lib/services/stableService";

async function fetchStableView(stableId: string): Promise<StableViewResponse> {
  const response = await fetchWithAuth(`/api/v1/stables/${encodeURIComponent(stableId)}`);
  return parseApiResponse<StableViewResponse>(response);
}

export function useStableView(stableId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stables.view(stableId!),
    queryFn: () => fetchStableView(stableId!),
    staleTime: 60_000,
    enabled: !!stableId,
  });
}

async function fetchStableList(filters: StableListFilters = {}): Promise<StableListResult> {
  const params = new URLSearchParams();
  if (filters.favorites) params.set("favorites", "true");
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  const response = await fetchWithAuth(`/api/v1/stables${qs ? `?${qs}` : ""}`);
  return parseApiResponse<StableListResult>(response);
}

export function useStableList(filters: StableListFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.stables.lists(), filters],
    queryFn: () => fetchStableList(filters),
    staleTime: 30_000,
  });
}

async function createStableApi(input: CreateStableInput) {
  const response = await fetchWithAuth("/api/v1/stables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ stable: { id: string } }>(response);
}

export function useCreateStable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStableApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stables.lists() });
    },
  });
}
