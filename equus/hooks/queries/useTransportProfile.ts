/**
 * TanStack Query hooks for the transport profile edit.
 *
 * `useUpdateTransportProfile` persists profile fields via
 * `PATCH /api/v1/transports/:id` and invalidates the transport view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { TransportProfileFormValues } from "@/lib/validations/transportForms.ts";

async function patchTransportProfile(
  transportId: string,
  input: TransportProfileFormValues,
): Promise<{ transport: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/transports/${transportId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ transport: { id: string } }>(response);
}

export function useUpdateTransportProfile(transportId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TransportProfileFormValues) =>
      patchTransportProfile(transportId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transports.view(transportId) });
    },
  });
}
