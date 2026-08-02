/**
 * TanStack Query hooks for the riding club profile edit.
 *
 * `useUpdateRidingClubProfile` persists profile fields via
 * `PATCH /api/v1/riding-clubs/:id` and invalidates the club view cache.
 * Free-form facilities (comma-separated in the form) and the numeric
 * membership fee are mapped to their API shapes before sending.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { UpdateRidingClubProfileInput } from "@/lib/services/ridingClubService.ts";
import type { RidingClubProfileFormValues } from "@/lib/validations/ridingClubForms.ts";

function toProfilePatch(values: RidingClubProfileFormValues): UpdateRidingClubProfileInput {
  const patch: UpdateRidingClubProfileInput = {
    clubName: values.clubName,
    description: values.description,
    email: values.email,
    phoneNumber: values.phoneNumber,
    disciplines: values.disciplines,
    address: values.address,
  };

  if (values.facilities && values.facilities.trim()) {
    patch.facilities = values.facilities
      .split(",")
      .map((facility) => facility.trim())
      .filter(Boolean);
  }

  if (values.membershipInfo && values.membershipInfo.trim()) {
    patch.membershipInfo = values.membershipInfo;
  }

  if (values.membershipFee && values.membershipFee.trim() !== "") {
    patch.membershipFee = Number(values.membershipFee);
  }

  return patch;
}

async function patchRidingClubProfile(
  clubId: string,
  values: RidingClubProfileFormValues,
): Promise<{ ridingClub: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/riding-clubs/${clubId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(toProfilePatch(values)),
  });
  return parseApiResponse<{ ridingClub: { id: string } }>(response);
}

export function useUpdateRidingClubProfile(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: RidingClubProfileFormValues) => patchRidingClubProfile(clubId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ridingClubs.view(clubId) });
    },
  });
}
