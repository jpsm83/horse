/**
 * TanStack Query hooks for riding clubs.
 *
 * `useRidingClubView(clubId)` calls `GET /api/v1/riding-clubs/:id`. `useRidingClubList`
 * reads the authenticated user's owned clubs. `useCreateRidingClub` creates a
 * club and invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateRidingClubInput,
  RidingClubListResult,
  RidingClubViewResponse,
} from "@/lib/services/ridingClubService";

async function fetchRidingClubView(clubId: string): Promise<RidingClubViewResponse> {
  const response = await fetchWithAuth(`/api/v1/riding-clubs/${encodeURIComponent(clubId)}`);
  const data = await parseApiResponse<{ ridingClub: RidingClubViewResponse }>(response);
  return data.ridingClub;
}

export function useRidingClubView(clubId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ridingClubs.view(clubId!),
    queryFn: () => fetchRidingClubView(clubId!),
    staleTime: 60_000,
    enabled: !!clubId,
  });
}

async function fetchRidingClubList(): Promise<RidingClubListResult> {
  const response = await fetchWithAuth("/api/v1/riding-clubs?mine=true");
  return parseApiResponse<RidingClubListResult>(response);
}

export function useRidingClubList() {
  return useQuery({
    queryKey: queryKeys.ridingClubs.lists(),
    queryFn: fetchRidingClubList,
    staleTime: 30_000,
  });
}

async function createRidingClubApi(input: CreateRidingClubInput) {
  const response = await fetchWithAuth("/api/v1/riding-clubs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ ridingClub: { id: string } }>(response);
}

export function useCreateRidingClub() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRidingClubApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ridingClubs.lists() });
    },
  });
}
