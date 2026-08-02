/**
 * TanStack Query hooks for the groom profile edit.
 *
 * `useUpdateGroomProfile` persists profile fields via
 * `PATCH /api/v1/grooms/:id` and invalidates the groom view cache. Form values
 * are converted to the API shape: comma-separated `specialties` split into an
 * array and `experienceYears` coerced to a number (empty clears the field).
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { UpdateGroomProfileInput } from "@/lib/services/groomService";
import type { GroomProfileFormValues } from "@/lib/validations/groomForms.ts";

function toProfileInput(values: GroomProfileFormValues): UpdateGroomProfileInput {
  const specialties = values.specialties
    ? values.specialties
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : undefined;

  const experienceYears =
    values.experienceYears.trim() === "" ? undefined : Number(values.experienceYears);

  return {
    displayName: values.displayName,
    email: values.email,
    bio: values.bio,
    phoneNumber: values.phoneNumber,
    ...(specialties && specialties.length > 0 ? { specialties } : {}),
    ...(experienceYears !== undefined ? { experienceYears } : {}),
  };
}

async function patchGroomProfile(
  groomId: string,
  input: UpdateGroomProfileInput,
): Promise<{ groom: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/grooms/${groomId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ groom: { id: string } }>(response);
}

export function useUpdateGroomProfile(groomId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: GroomProfileFormValues) =>
      patchGroomProfile(groomId, toProfileInput(values)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.grooms.view(groomId) });
    },
  });
}
