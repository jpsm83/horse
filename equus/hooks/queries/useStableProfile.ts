/**
 * TanStack Query hooks for the stable profile edit.
 *
 * `useUpdateStableProfile` persists profile fields via
 * `PATCH /api/v1/stables/:id` and invalidates the stable view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { StableProfileFormValues } from "@/lib/validations/stableForms.ts";

async function patchStableProfile(
  stableId: string,
  input: StableProfileFormValues,
): Promise<{ stable: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/stables/${stableId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ stable: { id: string } }>(response);
}

export function useUpdateStableProfile(stableId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: StableProfileFormValues) => patchStableProfile(stableId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stables.view(stableId) });
    },
  });
}
