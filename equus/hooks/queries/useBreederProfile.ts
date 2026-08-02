/**
 * TanStack Query hooks for the breeder profile edit.
 *
 * `useUpdateBreederProfile` persists profile fields via
 * `PATCH /api/v1/breeders/:id` and invalidates the breeder view cache. The
 * form's comma-separated `bloodlines` string is split into `string[]` before
 * sending so the API contract (array) stays stable.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { BreederProfileFormValues } from "@/lib/validations/breederForms.ts";

type BreederProfilePatch = Omit<BreederProfileFormValues, "bloodlines"> & {
  bloodlines?: string[];
};

async function patchBreederProfile(
  breederId: string,
  input: BreederProfilePatch,
): Promise<{ breeder: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/breeders/${breederId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ breeder: { id: string } }>(response);
}

export function useUpdateBreederProfile(breederId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BreederProfileFormValues) => {
      const { bloodlines, ...rest } = input;
      const bloodlineList = (bloodlines ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      return patchBreederProfile(breederId, { ...rest, bloodlines: bloodlineList });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.breeders.view(breederId) });
    },
  });
}
