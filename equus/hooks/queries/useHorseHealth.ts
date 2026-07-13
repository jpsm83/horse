"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicHealthRecord } from "@/lib/services/horseHealthService";

async function fetchHealthRecords(horseId: string): Promise<PublicHealthRecord[]> {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/health`);
  const data = await parseApiResponse<{ records: PublicHealthRecord[] }>(res);
  return data.records;
}

async function createHealthRecordApi(horseId: string, input: Record<string, unknown>) {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/health`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ record: PublicHealthRecord }>(res);
}

export function useHorseHealthRecords(horseId: string) {
  return useQuery({
    queryKey: queryKeys.horses.health(horseId),
    queryFn: () => fetchHealthRecords(horseId),
    enabled: !!horseId,
  });
}

export function useCreateHealthRecord(horseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Record<string, unknown>) => createHealthRecordApi(horseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.health(horseId) });
    },
  });
}
