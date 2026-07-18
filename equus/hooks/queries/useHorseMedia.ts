"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    placeholderData: (previousData) => previousData,
  });
}

type UploadMediaInput = {
  files: File[];
  sourceEntityType: string;
  sourceEntityId?: string;
};

export function useUploadHorseMedia(horseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ files, sourceEntityType, sourceEntityId }: UploadMediaInput): Promise<PublicMedia[]> => {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      formData.append("sourceEntityType", sourceEntityType);
      if (sourceEntityId) {
        formData.append("sourceEntityId", sourceEntityId);
      }

      const res = await fetch(
        `/api/v1/horses/${encodeURIComponent(horseId)}/media/upload`,
        {
          method: "POST",
          body: formData,
          credentials: "include",
        },
      );
      const data = await parseApiResponse<{ media: PublicMedia[] }>(res);
      return data.media;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.horses.all, horseId, "media"],
      });
    },
  });
}

export function useDeleteHorseMedia(horseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ mediaId }: { mediaId: string }) => {
      const res = await fetchWithAuth(
        `/api/v1/horses/${encodeURIComponent(horseId)}/media/${encodeURIComponent(mediaId)}`,
        { method: "DELETE" },
      );
      return parseApiResponse<{ deleted: boolean }>(res);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.horses.all, horseId, "media"],
      });
    },
  });
}
