"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";

export type EntitySearchResult = {
  id: string;
  name: string;
  email: string;
  entityType: string;
  entityLabel: string;
};

type EntitySearchResponse = {
  results: EntitySearchResult[];
};

async function fetchEntitySearch(query: string): Promise<EntitySearchResult[]> {
  const res = await fetch(`/api/v1/search/entities?q=${encodeURIComponent(query.trim())}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Search failed");
  const data: EntitySearchResponse = await res.json();
  return data.results ?? [];
}

export function useEntitySearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.entities(query),
    queryFn: () => fetchEntitySearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
