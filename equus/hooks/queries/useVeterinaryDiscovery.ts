/**
 * TanStack Query hooks for veterinary discovery settings.
 *
 * `useUpdateVeterinaryDiscovery` persists `isPublic` / `acceptsNewPatients` via
 * `PATCH /api/v1/veterinaries/:id/discovery` and invalidates the veterinary view
 * cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateVeterinaryDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewPatients?: boolean;
};

async function patchVeterinaryDiscovery(
  veterinaryId: string,
  input: UpdateVeterinaryDiscoveryInput,
): Promise<{ veterinary: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/veterinaries/${veterinaryId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ veterinary: { id: string } }>(response);
}

export function useUpdateVeterinaryDiscovery(veterinaryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateVeterinaryDiscoveryInput) =>
      patchVeterinaryDiscovery(veterinaryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.veterinaries.view(veterinaryId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.veterinaries.lists() });
    },
  });
}
