"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { DiscoverProviderCard, DiscoverProviderType, DiscoverScope } from "@/lib/api/discoverClient";

type SearchInput = {
  type: DiscoverProviderType;
  q?: string;
  limit?: number;
  scope?: DiscoverScope;
};

async function searchProviders(input: SearchInput): Promise<DiscoverProviderCard[]> {
  const params = new URLSearchParams({ type: input.type });
  if (input.q?.trim()) params.set("q", input.q.trim());
  if (input.limit != null) params.set("limit", String(input.limit));
  if (input.scope) params.set("scope", input.scope);

  const response = await fetchWithAuth(`/api/v1/discover/providers?${params.toString()}`);
  const data = await parseApiResponse<{ providers: DiscoverProviderCard[] }>(response);
  return data.providers;
}

export function useDiscoverProviders(type: DiscoverProviderType, q?: string) {
  return useQuery({
    queryKey: queryKeys.discover.providers(type, q),
    queryFn: () => searchProviders({ type, q }),
    enabled: !!type,
    staleTime: 10_000,
  });
}
