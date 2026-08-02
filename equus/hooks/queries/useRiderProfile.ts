/**
 * TanStack Query hooks for the rider profile edit.
 *
 * `useUpdateRiderProfile` persists profile fields via
 * `PATCH /api/v1/riders/:id` and invalidates the rider view cache. The form's
 * comma-separated `competitionHighlights` string is split into a `string[]` and
 * `experienceYears` converted to a number before sending so the API contract
 * (array / number) stays stable.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { UpdateRiderProfileInput } from "@/lib/services/riderService.ts";
import type { RiderProfileFormValues } from "@/lib/validations/riderForms.ts";

function toProfilePatch(values: RiderProfileFormValues): UpdateRiderProfileInput {
  const patch: UpdateRiderProfileInput = {
    displayName: values.displayName,
    email: values.email,
    disciplines: values.disciplines,
  };

  if (values.bio && values.bio.trim()) {
    patch.bio = values.bio;
  }

  if (values.phoneNumber && values.phoneNumber.trim()) {
    patch.phoneNumber = values.phoneNumber;
  }

  if (values.experienceYears && values.experienceYears.trim() !== "") {
    patch.experienceYears = Number(values.experienceYears);
  }

  if (values.competitionHighlights && values.competitionHighlights.trim()) {
    patch.competitionHighlights = values.competitionHighlights
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return patch;
}

async function patchRiderProfile(
  riderId: string,
  values: RiderProfileFormValues,
): Promise<{ rider: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/riders/${riderId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toProfilePatch(values)),
  });
  return parseApiResponse<{ rider: { id: string } }>(response);
}

export function useUpdateRiderProfile(riderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: RiderProfileFormValues) => patchRiderProfile(riderId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.riders.view(riderId) });
    },
  });
}
