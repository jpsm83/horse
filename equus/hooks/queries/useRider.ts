/**
 * TanStack Query hooks for riders.
 *
 * `useRiderView(riderId)` reads the role-scoped rider view seeded by the
 * detail `layout.tsx` RSC (falls back to REST on miss). `useRiderList` reads
 * the authenticated user's owned rider profile. `useCreateRider` creates a rider
 * and invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateRiderInput,
  RiderListResult,
  RiderViewResponse,
} from "@/lib/services/riderService";

async function fetchRiderView(riderId: string): Promise<RiderViewResponse> {
  const response = await fetchWithAuth(`/api/v1/riders/${encodeURIComponent(riderId)}`);
  const data = await parseApiResponse<{ rider: RiderViewResponse }>(response);
  return data.rider;
}

export function useRiderView(riderId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.riders.view(riderId!),
    queryFn: () => fetchRiderView(riderId!),
    staleTime: 60_000,
    enabled: !!riderId,
  });
}

async function fetchRiderList(): Promise<RiderListResult> {
  const response = await fetchWithAuth("/api/v1/riders");
  return parseApiResponse<RiderListResult>(response);
}

export function useRiderList() {
  return useQuery({
    queryKey: queryKeys.riders.lists(),
    queryFn: fetchRiderList,
    staleTime: 30_000,
  });
}

async function createRiderApi(input: CreateRiderInput) {
  const response = await fetchWithAuth("/api/v1/riders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ rider: { _id: string } }>(response);
}

export function useCreateRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRiderApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.riders.lists() });
    },
  });
}
