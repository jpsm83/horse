/**
 * TanStack Query hooks for trainer discovery settings.
 *
 * `useUpdateTrainerDiscovery` persists `isPublic` / `acceptsNewClients` via
 * `PATCH /api/v1/trainers/:id/discovery` and invalidates the trainer view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateTrainerDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewClients?: boolean;
};

async function patchTrainerDiscovery(
  trainerId: string,
  input: UpdateTrainerDiscoveryInput,
): Promise<{ trainer: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/trainers/${trainerId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ trainer: { id: string } }>(response);
}

export function useUpdateTrainerDiscovery(trainerId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTrainerDiscoveryInput) => patchTrainerDiscovery(trainerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.view(trainerId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.trainers.lists() });
    },
  });
}
