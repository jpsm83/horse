/**
 * TanStack Query hooks for the veterinary profile edit.
 *
 * `useUpdateVeterinaryProfile` persists profile fields via
 * `PATCH /api/v1/veterinaries/:id` and invalidates the veterinary view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { VeterinaryProfileFormValues } from "@/lib/validations/veterinaryForms.ts";

async function patchVeterinaryProfile(
  veterinaryId: string,
  input: VeterinaryProfileFormValues,
): Promise<{ veterinary: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/veterinaries/${veterinaryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ veterinary: { id: string } }>(response);
}

export function useUpdateVeterinaryProfile(veterinaryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: VeterinaryProfileFormValues) =>
      patchVeterinaryProfile(veterinaryId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.veterinaries.view(veterinaryId) });
    },
  });
}
