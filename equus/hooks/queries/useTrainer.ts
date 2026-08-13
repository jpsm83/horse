/**
 * TanStack Query hooks for trainer profiles.
 *
 * `useTrainerView(trainerId)` calls `GET /api/v1/trainers/:id`. `useTrainerList` reads
 * the authenticated user's trainer profile ("my trainer profile").
 * `useCreateTrainer` creates a trainer profile and invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateTrainerInput,
  TrainerListResult,
  TrainerViewResponse,
} from "@/lib/services/trainerService";

async function fetchTrainerView(trainerId: string): Promise<TrainerViewResponse> {
  const response = await fetchWithAuth(`/api/v1/trainers/${encodeURIComponent(trainerId)}`);
  return parseApiResponse<TrainerViewResponse>(response);
}

export function useTrainerView(trainerId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.trainers.view(trainerId!),
    queryFn: () => fetchTrainerView(trainerId!),
    staleTime: 60_000,
    enabled: !!trainerId,
  });
}

async function fetchTrainerList(): Promise<TrainerListResult> {
  const response = await fetchWithAuth("/api/v1/trainers");
  return parseApiResponse<TrainerListResult>(response);
}

export function useTrainerList() {
  return useQuery({
    queryKey: queryKeys.trainers.lists(),
    queryFn: fetchTrainerList,
    staleTime: 30_000,
  });
}

async function createTrainerApi(input: CreateTrainerInput) {
  const response = await fetchWithAuth("/api/v1/trainers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ trainer: { _id: string } }>(response);
}

export function useCreateTrainer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTrainerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.lists() });
    },
  });
}
