/**
 * TanStack Query hooks for riding club discovery settings.
 *
 * `useUpdateRidingClubDiscovery` persists `isPublic` / `acceptsNewMembers` via
 * `PATCH /api/v1/riding-clubs/:id/discovery` and invalidates the club view cache.
 */

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type UpdateRidingClubDiscoveryInput = {
  isPublic?: boolean;
  acceptsNewMembers?: boolean;
};

async function patchRidingClubDiscovery(
  clubId: string,
  input: UpdateRidingClubDiscoveryInput,
): Promise<{ ridingClub: { id: string } }> {
  const response = await fetchWithAuth(`/api/v1/riding-clubs/${clubId}/discovery`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ ridingClub: { id: string } }>(response);
}

export function useUpdateRidingClubDiscovery(clubId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateRidingClubDiscoveryInput) => patchRidingClubDiscovery(clubId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ridingClubs.view(clubId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ridingClubs.lists() });
    },
  });
}
