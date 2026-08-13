/**
 * TanStack Query hooks for breeders.
 *
 * `useBreederView(breederId)` calls `GET /api/v1/breeders/:id`. `useBreederList` reads
 * the authenticated user's owned breeders. `useCreateBreeder` creates a breeder
 * and invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateBreederInput,
  BreederListResult,
  BreederViewResponse,
} from "@/lib/services/breederService";

async function fetchBreederView(breederId: string): Promise<BreederViewResponse> {
  const response = await fetchWithAuth(`/api/v1/breeders/${encodeURIComponent(breederId)}`);
  return parseApiResponse<BreederViewResponse>(response);
}

export function useBreederView(breederId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.breeders.view(breederId!),
    queryFn: () => fetchBreederView(breederId!),
    staleTime: 60_000,
    enabled: !!breederId,
  });
}

async function fetchBreederList(): Promise<BreederListResult> {
  const response = await fetchWithAuth("/api/v1/breeders?mine=true");
  return parseApiResponse<BreederListResult>(response);
}

export function useBreederList() {
  return useQuery({
    queryKey: queryKeys.breeders.lists(),
    queryFn: fetchBreederList,
    staleTime: 30_000,
  });
}

async function createBreederApi(input: CreateBreederInput) {
  const response = await fetchWithAuth("/api/v1/breeders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ breeder: { id: string } }>(response);
}

export function useCreateBreeder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBreederApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.breeders.lists() });
    },
  });
}
