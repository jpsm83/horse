/**
 * @deprecated Use TanStack Query hooks from `hooks/queries/useDiscover.ts` instead.
 * Kept for backward compatibility during migration.
 */

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";

export type DiscoverProviderCard = {
  id: string;
  label: string;
  subtitle?: string;
  imageUrl?: string;
};

export type DiscoverProviderType =
  | "stable"
  | "trainer"
  | "veterinary"
  | "groom"
  | "farrier"
  | "rider"
  | "breeder"
  | "ridingClub"
  | "transport"
  | "coach";

export type DiscoverScope = "horse" | "host";

/** Search discoverable provider profiles for an invite picker. */
export async function searchDiscoverProviders(input: {
  type: DiscoverProviderType;
  q?: string;
  limit?: number;
  scope?: DiscoverScope;
}): Promise<DiscoverProviderCard[]> {
  const params = new URLSearchParams({ type: input.type });
  if (input.q?.trim()) params.set("q", input.q.trim());
  if (input.limit != null) params.set("limit", String(input.limit));
  if (input.scope) params.set("scope", input.scope);

  const response = await fetchWithAuth(`/api/v1/discover/providers?${params.toString()}`);
  const data = await parseApiResponse<{ providers: DiscoverProviderCard[] }>(response);
  return data.providers;
}
