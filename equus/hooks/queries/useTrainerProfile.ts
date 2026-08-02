/**
 * TanStack Query hooks for the trainer profile edit.
 *
 * `useUpdateTrainerProfile` persists profile fields via
 * `PATCH /api/v1/trainers/:id` and invalidates the trainer view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { TrainerProfileFormValues } from "@/lib/validations/trainerForms.ts";

async function patchTrainerProfile(
  trainerId: string,
  input: TrainerProfileFormValues,
): Promise<{ trainer: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/trainers/${trainerId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ trainer: { id: string } }>(response);
}

export function useUpdateTrainerProfile(trainerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TrainerProfileFormValues) => patchTrainerProfile(trainerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.view(trainerId) });
    },
  });
}
