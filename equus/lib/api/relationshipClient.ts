/**
 * Relationship REST client — horse owner invites and invitee responses.
 */

import type { PublicRelationship } from "@/lib/api/authClient.ts";
import { ApiClientError } from "@/lib/api/authClient.ts";
import type { DiscoverProviderType } from "@/lib/api/discoverClient.ts";

type ApiSuccess<T> = { data: T };
type ApiErrorBody = { error?: { code?: string; message?: string } };

export type CreateRelationshipInvitePayload = {
  horseId: string;
  relationshipType: DiscoverProviderType;
  receiverAccountId?: string;
  invitedEmail?: string;
  invitedName?: string;
  requestMessage?: string;
};

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

/** Horse owner sends a provider invitation. */
export async function createRelationshipInvite(
  payload: CreateRelationshipInvitePayload,
): Promise<PublicRelationship> {
  const response = await apiFetch("/api/v1/relationships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<{ relationship: PublicRelationship }>(response);
  return data.relationship;
}

export { ApiClientError as RelationshipClientError };
