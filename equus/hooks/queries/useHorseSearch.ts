import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";

export type HorseSearchResult = {
  id: string;
  name: string;
  registeredName?: string;
  ownerName: string;
  ownerEmail: string;
  ownerId: string;
};

type HorseSearchResponse = {
  data?: {
    results?: HorseSearchResult[];
  };
};

async function fetchHorseSearch(query: string): Promise<HorseSearchResult[]> {
  const res = await fetch(`/api/v1/horses/search?q=${encodeURIComponent(query.trim())}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Horse search failed");
  const body: HorseSearchResponse = await res.json();
  return body.data?.results ?? [];
}

export function useHorseSearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search.horses(query),
    queryFn: () => fetchHorseSearch(query),
    enabled: query.trim().length >= 2,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  });
}
