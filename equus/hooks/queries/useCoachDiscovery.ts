/**
 * TanStack Query hooks for coach discovery settings.
 *
 * `useUpdateCoachDiscovery` persists `isPublic` / `acceptsNewClients` via
 * `PATCH /api/v1/coaches/:id/discovery` and invalidates the coach view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateCoachDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewClients?: boolean;
};

async function patchCoachDiscovery(
  coachId: string,
  input: UpdateCoachDiscoveryInput,
): Promise<{ coach: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/coaches/${coachId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ coach: { id: string } }>(response);
}

export function useUpdateCoachDiscovery(coachId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCoachDiscoveryInput) => patchCoachDiscovery(coachId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coaches.view(coachId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.coaches.lists() });
    },
  });
}
