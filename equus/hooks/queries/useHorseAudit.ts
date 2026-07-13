"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicAuditLog } from "@/lib/services/horseAuditService";

async function fetchAuditLogs(horseId: string): Promise<PublicAuditLog[]> {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/audit`);
  const data = await parseApiResponse<{ logs: PublicAuditLog[] }>(res);
  return data.logs;
}

export function useHorseAuditLogs(horseId: string) {
  return useQuery({
    queryKey: [...queryKeys.horses.all, horseId, "audit"],
    queryFn: () => fetchAuditLogs(horseId),
    enabled: !!horseId,
  });
}
