"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { InviteRefPreview } from "@/lib/services/invitePreviewService";

async function fetchInvitePreview(ref: string): Promise<InviteRefPreview | null> {
  const response = await fetchWithAuth(`/api/v1/invites/preview?ref=${encodeURIComponent(ref)}`);

  if (response.status === 404) {
    return null;
  }

  const data = await parseApiResponse<{ preview: InviteRefPreview }>(response);
  return data.preview;
}

export function useInvitePreview(ref: string | undefined) {
  return useQuery({
    queryKey: queryKeys.invites.preview(ref!),
    queryFn: () => fetchInvitePreview(ref!),
    enabled: !!ref,
    retry: false,
  });
}
