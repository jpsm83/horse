/**
 * TanStack Query hooks for groom discovery settings.
 *
 * `useUpdateGroomDiscovery` persists `isPublic` / `acceptsNewClients` via
 * `PATCH /api/v1/grooms/:id/discovery` and invalidates the groom view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateGroomDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewClients?: boolean;
};

async function patchGroomDiscovery(
  groomId: string,
  input: UpdateGroomDiscoveryInput,
): Promise<{ groom: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/grooms/${groomId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ groom: { id: string } }>(response);
}

export function useUpdateGroomDiscovery(groomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateGroomDiscoveryInput) => patchGroomDiscovery(groomId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grooms.view(groomId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.grooms.lists() });
    },
  });
}
