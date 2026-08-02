/**
 * TanStack Query hooks for the coach profile edit.
 *
 * `useUpdateCoachProfile` persists profile fields via
 * `PATCH /api/v1/coaches/:id` and invalidates the coach view cache. The form's
 * comma-separated `competitionLevels` / `preparationServices` strings are split
 * into `string[]` and `experienceYears` converted to a number before sending so
 * the API contract (array / number) stays stable.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { UpdateCoachProfileInput } from "@/lib/services/coachService.ts";
import type { CoachProfileFormValues } from "@/lib/validations/coachForms.ts";

function toProfilePatch(values: CoachProfileFormValues): UpdateCoachProfileInput {
  const patch: UpdateCoachProfileInput = {
    displayName: values.displayName,
    bio: values.bio,
    email: values.email,
    phoneNumber: values.phoneNumber,
    disciplines: values.disciplines,
  };

  if (values.competitionLevels && values.competitionLevels.trim()) {
    patch.competitionLevels = values.competitionLevels
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (values.preparationServices && values.preparationServices.trim()) {
    patch.preparationServices = values.preparationServices
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (values.experienceYears && values.experienceYears.trim() !== "") {
    patch.experienceYears = Number(values.experienceYears);
  }

  return patch;
}

async function patchCoachProfile(
  coachId: string,
  values: CoachProfileFormValues,
): Promise<{ coach: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/coaches/${coachId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toProfilePatch(values)),
  });
  return parseApiResponse<{ coach: { id: string } }>(response);
}

export function useUpdateCoachProfile(coachId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: CoachProfileFormValues) => patchCoachProfile(coachId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.coaches.view(coachId) });
    },
  });
}
