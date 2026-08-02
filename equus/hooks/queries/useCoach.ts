/**
 * TanStack Query hooks for coaches.
 *
 * `useCoachView(coachId)` reads the role-scoped coach view seeded by the
 * detail `layout.tsx` RSC (falls back to REST on miss). `useCoachList` reads
 * the authenticated user's owned coach profile. `useCreateCoach` creates a coach
 * and invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CoachListResult,
  CoachViewResponse,
  CreateCoachInput,
} from "@/lib/services/coachService";

async function fetchCoachView(coachId: string): Promise<CoachViewResponse> {
  const response = await fetchWithAuth(`/api/v1/coaches/${encodeURIComponent(coachId)}`);
  const data = await parseApiResponse<{ coach: CoachViewResponse }>(response);
  return data.coach;
}

export function useCoachView(coachId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.coaches.view(coachId!),
    queryFn: () => fetchCoachView(coachId!),
    staleTime: 60_000,
    enabled: !!coachId,
  });
}

async function fetchCoachList(): Promise<CoachListResult> {
  const response = await fetchWithAuth("/api/v1/coaches");
  return parseApiResponse<CoachListResult>(response);
}

export function useCoachList() {
  return useQuery({
    queryKey: queryKeys.coaches.lists(),
    queryFn: fetchCoachList,
    staleTime: 30_000,
  });
}

async function createCoachApi(input: CreateCoachInput) {
  const response = await fetchWithAuth("/api/v1/coaches", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ coach: { _id: string } }>(response);
}

export function useCreateCoach() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCoachApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coaches.lists() });
    },
  });
}
