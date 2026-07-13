"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicMedia } from "@/lib/services/horseMediaService";

async function fetchMedia(horseId: string): Promise<PublicMedia[]> {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/media`);
  const data = await parseApiResponse<{ media: PublicMedia[] }>(res);
  return data.media;
}

export function useHorseMedia(horseId: string) {
  return useQuery({
    queryKey: [...queryKeys.horses.all, horseId, "media"],
    queryFn: () => fetchMedia(horseId),
    enabled: !!horseId,
  });
}
