/**
 * TanStack Query hooks for breeder discovery settings.
 *
 * `useUpdateBreederDiscovery` persists `isPublic` via
 * `PATCH /api/v1/breeders/:id/discovery` and invalidates the breeder view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateBreederDiscoveryInput = {
  isPublic?: boolean;
};

async function patchBreederDiscovery(
  breederId: string,
  input: UpdateBreederDiscoveryInput,
): Promise<{ breeder: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/breeders/${breederId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ breeder: { id: string } }>(response);
}

export function useUpdateBreederDiscovery(breederId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateBreederDiscoveryInput) => patchBreederDiscovery(breederId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.breeders.view(breederId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.breeders.lists() });
    },
  });
}
