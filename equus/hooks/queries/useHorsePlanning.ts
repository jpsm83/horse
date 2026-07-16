"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";

export type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  eventType: string;
  location?: string;
  sourceEntityType?: string;
  sourceEntityId?: string;
};

async function fetchPlanning(horseId: string, from?: string, to?: string): Promise<CalendarEvent[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/planning${qs ? `?${qs}` : ""}`);
  const data = await parseApiResponse<{ events: CalendarEvent[] }>(res);
  return data.events;
}

export function useHorsePlanning(horseId: string, from?: string, to?: string) {
  return useQuery({
    queryKey: queryKeys.horses.planning(horseId),
    queryFn: () => fetchPlanning(horseId, from, to),
    enabled: !!horseId,
  });
}
