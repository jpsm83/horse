/**
 * TanStack Query hooks for veterinary profiles.
 *
 * `useVeterinaryView(veterinaryId)` calls `GET /api/v1/veterinaries/:id`.
 * `useVeterinaryList` reads the authenticated user's veterinary practice ("my
 * veterinary practice"). `useCreateVeterinary` creates a veterinary profile and
 * invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateVeterinaryInput,
  VeterinaryListResult,
  VeterinaryViewResponse,
} from "@/lib/services/veterinaryService";

async function fetchVeterinaryView(veterinaryId: string): Promise<VeterinaryViewResponse> {
  const response = await fetchWithAuth(
    `/api/v1/veterinaries/${encodeURIComponent(veterinaryId)}`,
  );
  return parseApiResponse<VeterinaryViewResponse>(response);
}

export function useVeterinaryView(veterinaryId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.veterinaries.view(veterinaryId!),
    queryFn: () => fetchVeterinaryView(veterinaryId!),
    staleTime: 60_000,
    enabled: !!veterinaryId,
  });
}

async function fetchVeterinaryList(): Promise<VeterinaryListResult> {
  const response = await fetchWithAuth("/api/v1/veterinaries");
  return parseApiResponse<VeterinaryListResult>(response);
}

export function useVeterinaryList() {
  return useQuery({
    queryKey: queryKeys.veterinaries.lists(),
    queryFn: fetchVeterinaryList,
    staleTime: 30_000,
  });
}

async function createVeterinaryApi(input: CreateVeterinaryInput) {
  const response = await fetchWithAuth("/api/v1/veterinaries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ veterinary: { _id: string } }>(response);
}

export function useCreateVeterinary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createVeterinaryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.veterinaries.lists() });
    },
  });
}
