/**
 * TanStack Query hooks for stables.
 *
 * `useStableView(stableId)` reads the role-scoped stable view seeded by the
 * detail `layout.tsx` RSC (falls back to REST on miss). `useStableList` reads
 * the authenticated user's owned stables. `useCreateStable` creates a stable and
 * invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateStableInput,
  StableListResult,
  StableViewResponse,
} from "@/lib/services/stableService";

async function fetchStableView(stableId: string): Promise<StableViewResponse> {
  const response = await fetchWithAuth(`/api/v1/stables/${encodeURIComponent(stableId)}`);
  const data = await parseApiResponse<{ stable: StableViewResponse }>(response);
  return data.stable;
}

export function useStableView(stableId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stables.view(stableId!),
    queryFn: () => fetchStableView(stableId!),
    staleTime: 60_000,
    enabled: !!stableId,
  });
}

async function fetchStableList(): Promise<StableListResult> {
  const response = await fetchWithAuth("/api/v1/stables?mine=true");
  return parseApiResponse<StableListResult>(response);
}

export function useStableList() {
  return useQuery({
    queryKey: queryKeys.stables.lists(),
    queryFn: fetchStableList,
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
