/**
 * TanStack Query hooks for grooms.
 *
 * `useGroomView(groomId)` calls `GET /api/v1/grooms/:id`. `useGroomList` reads the
 * authenticated user's groom profile. `useCreateGroom` creates a groom and
 * invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateGroomInput,
  GroomListResult,
  GroomViewResponse,
} from "@/lib/services/groomService";

async function fetchGroomView(groomId: string): Promise<GroomViewResponse> {
  const response = await fetchWithAuth(`/api/v1/grooms/${encodeURIComponent(groomId)}`);
  const data = await parseApiResponse<{ groom: GroomViewResponse }>(response);
  return data.groom;
}

export function useGroomView(groomId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.grooms.view(groomId!),
    queryFn: () => fetchGroomView(groomId!),
    staleTime: 60_000,
    enabled: !!groomId,
  });
}

async function fetchGroomList(): Promise<GroomListResult> {
  const response = await fetchWithAuth("/api/v1/grooms?mine=true");
  return parseApiResponse<GroomListResult>(response);
}

export function useGroomList() {
  return useQuery({
    queryKey: queryKeys.grooms.lists(),
    queryFn: fetchGroomList,
    staleTime: 30_000,
  });
}

async function createGroomApi(input: CreateGroomInput) {
  const response = await fetchWithAuth("/api/v1/grooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ groom: { id: string } }>(response);
}

export function useCreateGroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGroomApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grooms.lists() });
    },
  });
}
