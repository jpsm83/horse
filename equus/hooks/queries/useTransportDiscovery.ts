/**
 * TanStack Query hooks for transport discovery settings.
 *
 * `useUpdateTransportDiscovery` persists `isPublic` / `acceptsNewBookings` via
 * `PATCH /api/v1/transports/:id/discovery` and invalidates the transport view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateTransportDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewBookings?: boolean;
};

async function patchTransportDiscovery(
  transportId: string,
  input: UpdateTransportDiscoveryInput,
): Promise<{ transport: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/transports/${transportId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ transport: { id: string } }>(response);
}

export function useUpdateTransportDiscovery(transportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTransportDiscoveryInput) =>
      patchTransportDiscovery(transportId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transports.view(transportId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.transports.lists() });
    },
  });
}
