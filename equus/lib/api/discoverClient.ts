/**
 * Discover REST client — provider search for invitation pickers.
 */

import { ApiClientError } from "@/lib/api/authClient.ts";

type ApiSuccess<T> = { data: T };
type ApiErrorBody = { error?: { code?: string; message?: string } };

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

async function parseApiResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody;

  if (!response.ok) {
    const message =
      "error" in body && body.error?.message
        ? body.error.message
        : "Request failed";
    const code =
      "error" in body && body.error?.code
        ? body.error.code
        : `HTTP_${response.status}`;
    throw new ApiClientError(response.status, message, code);
  }

  return (body as ApiSuccess<T>).data;
}

async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  let response = await fetch(input, { ...init, credentials: "include" });

  if (response.status === 401) {
    const refreshed = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      response = await fetch(input, { ...init, credentials: "include" });
    }
  }

  return response;
}

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

  const response = await apiFetch(`/api/v1/discover/providers?${params.toString()}`);
  const data = await parseApiResponse<{ providers: DiscoverProviderCard[] }>(response);
  return data.providers;
}
