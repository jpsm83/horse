"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    placeholderData: (previousData) => previousData,
  });
}

export function useUploadHorseDocument(horseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(`/api/v1/horses/${encodeURIComponent(horseId)}/documents/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      return parseApiResponse<{ document: PublicHorseDocument }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.horses.all, horseId, "documents"] });
    },
  });
}

export function useDeleteHorseDocument(horseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docId: string) => {
      const res = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/documents/${encodeURIComponent(docId)}`, {
        method: "DELETE",
      });
      return parseApiResponse<{ deleted: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.horses.all, horseId, "documents"] });
    },
  });
}
