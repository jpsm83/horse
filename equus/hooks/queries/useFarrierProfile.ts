/**
 * TanStack Query hooks for the farrier profile edit.
 *
 * `useUpdateFarrierProfile` persists profile fields via
 * `PATCH /api/v1/farriers/:id` and invalidates the farrier view cache. Form
 * values are converted to the API shape: `experienceYears` and `serviceAreaKm`
 * are coerced to numbers (empty clears the field).
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { UpdateFarrierProfileInput } from "@/lib/services/farrierService";
import type { FarrierProfileFormValues } from "@/lib/validations/farrierForms.ts";

function toProfileInput(values: FarrierProfileFormValues): UpdateFarrierProfileInput {
  const experienceYears =
    values.experienceYears.trim() === "" ? undefined : Number(values.experienceYears);
  const serviceAreaKm =
    values.serviceAreaKm.trim() === "" ? undefined : Number(values.serviceAreaKm);

  return {
    displayName: values.displayName,
    email: values.email,
    bio: values.bio,
    phoneNumber: values.phoneNumber,
    ...(experienceYears !== undefined ? { experienceYears } : {}),
    ...(serviceAreaKm !== undefined ? { serviceAreaKm } : {}),
  };
}

async function patchFarrierProfile(
  farrierId: string,
  input: UpdateFarrierProfileInput,
): Promise<{ farrier: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/farriers/${farrierId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ farrier: { id: string } }>(response);
}

export function useUpdateFarrierProfile(farrierId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: FarrierProfileFormValues) =>
      patchFarrierProfile(farrierId, toProfileInput(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.farriers.view(farrierId) });
    },
  });
}
