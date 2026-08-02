/**
 * TanStack Query hooks for stable discovery settings.
 *
 * `useUpdateStableDiscovery` persists `isPublic` / `acceptsNewHorses` via
 * `PATCH /api/v1/stables/:id/discovery` and invalidates the stable view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateStableDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewHorses?: boolean;
};

async function patchStableDiscovery(
  stableId: string,
  input: UpdateStableDiscoveryInput,
): Promise<{ stable: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/stables/${stableId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ stable: { id: string } }>(response);
}

export function useUpdateStableDiscovery(stableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStableDiscoveryInput) => patchStableDiscovery(stableId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stables.view(stableId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.stables.lists() });
    },
  });
}
