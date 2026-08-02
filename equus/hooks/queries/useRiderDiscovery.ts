/**
 * TanStack Query hooks for rider discovery settings.
 *
 * `useUpdateRiderDiscovery` persists `isPublic` / `acceptsNewClients` via
 * `PATCH /api/v1/riders/:id/discovery` and invalidates the rider view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateRiderDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewClients?: boolean;
};

async function patchRiderDiscovery(
  riderId: string,
  input: UpdateRiderDiscoveryInput,
): Promise<{ rider: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/riders/${riderId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ rider: { id: string } }>(response);
}

export function useUpdateRiderDiscovery(riderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRiderDiscoveryInput) => patchRiderDiscovery(riderId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.riders.view(riderId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.riders.lists() });
    },
  });
}
