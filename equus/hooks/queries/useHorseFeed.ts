"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicFeedPlan } from "@/lib/services/horseFeedService";

async function fetchFeedPlans(horseId: string): Promise<PublicFeedPlan[]> {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/feed`);
  const data = await parseApiResponse<{ plans: PublicFeedPlan[] }>(res);
  return data.plans;
}

async function createFeedPlanApi(horseId: string, input: Record<string, unknown>) {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/feed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ plan: PublicFeedPlan }>(res);
}

export function useHorseFeedPlans(horseId: string) {
  return useQuery({
    queryKey: queryKeys.horses.feed(horseId),
    queryFn: () => fetchFeedPlans(horseId),
    enabled: !!horseId,
  });
}

export function useCreateFeedPlan(horseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => createFeedPlanApi(horseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.feed(horseId) });
    },
  });
}
