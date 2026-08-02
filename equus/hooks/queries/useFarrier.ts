/**
 * TanStack Query hooks for farriers.
 *
 * `useFarrierView(farrierId)` reads the role-aware farrier view seeded by the
 * detail `layout.tsx` RSC (falls back to REST on miss). `useFarrierList` reads
 * the authenticated user's farrier profile. `useCreateFarrier` creates a farrier
 * and invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateFarrierInput,
  FarrierListResult,
  FarrierViewResponse,
} from "@/lib/services/farrierService";

async function fetchFarrierView(farrierId: string): Promise<FarrierViewResponse> {
  const response = await fetchWithAuth(`/api/v1/farriers/${encodeURIComponent(farrierId)}`);
  const data = await parseApiResponse<{ farrier: FarrierViewResponse }>(response);
  return data.farrier;
}

export function useFarrierView(farrierId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.farriers.view(farrierId!),
    queryFn: () => fetchFarrierView(farrierId!),
    staleTime: 60_000,
    enabled: !!farrierId,
  });
}

async function fetchFarrierList(): Promise<FarrierListResult> {
  const response = await fetchWithAuth("/api/v1/farriers?mine=true");
  return parseApiResponse<FarrierListResult>(response);
}

export function useFarrierList() {
  return useQuery({
    queryKey: queryKeys.farriers.lists(),
    queryFn: fetchFarrierList,
    staleTime: 30_000,
  });
}

async function createFarrierApi(input: CreateFarrierInput) {
  const response = await fetchWithAuth("/api/v1/farriers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ farrier: { id: string } }>(response);
}

export function useCreateFarrier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFarrierApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.farriers.lists() });
    },
  });
}
