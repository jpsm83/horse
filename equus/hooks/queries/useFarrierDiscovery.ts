/**
 * TanStack Query hooks for farrier discovery settings.
 *
 * `useUpdateFarrierDiscovery` persists `isPublic` / `acceptsNewClients` via
 * `PATCH /api/v1/farriers/:id/discovery` and invalidates the farrier view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateFarrierDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewClients?: boolean;
};

async function patchFarrierDiscovery(
  farrierId: string,
  input: UpdateFarrierDiscoveryInput,
): Promise<{ farrier: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/farriers/${farrierId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ farrier: { id: string } }>(response);
}

export function useUpdateFarrierDiscovery(farrierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateFarrierDiscoveryInput) => patchFarrierDiscovery(farrierId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.farriers.view(farrierId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.farriers.lists() });
    },
  });
}
