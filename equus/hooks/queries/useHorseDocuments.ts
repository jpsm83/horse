"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicHorseDocument } from "@/lib/services/horseDocumentService";

async function fetchDocuments(horseId: string): Promise<PublicHorseDocument[]> {
  const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/documents`);
  const data = await parseApiResponse<{ documents: PublicHorseDocument[] }>(res);
  return data.documents;
}

export function useHorseDocuments(horseId: string) {
  return useQuery({
    queryKey: [...queryKeys.horses.all, horseId, "documents"],
    queryFn: () => fetchDocuments(horseId),
    enabled: !!horseId,
  });
}
