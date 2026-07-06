"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

type CreateStablePayload = {
  name: string;
  description?: string;
  phone?: string;
  email?: string;
};

async function fetchStable(stableId: string) {
  const response = await fetchWithAuth(`/api/v1/stables/${encodeURIComponent(stableId)}`);
  return parseApiResponse(response);
}

async function createStableApi(input: CreateStablePayload) {
  const response = await fetchWithAuth("/api/v1/stables", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse(response);
}

export function useStable(stableId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.stables.detail(stableId!),
    queryFn: () => fetchStable(stableId!),
    enabled: !!stableId,
  });
}

export function useCreateStable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStableApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.stables.lists() });
    },
  });
}
