/**
 * @deprecated Use TanStack Query hooks from `hooks/queries/useRelationship.ts` instead.
 * Kept for backward compatibility during migration.
 */

import type { PublicRelationship } from "@/lib/services/relationshipService";
import type { DiscoverProviderType } from "@/lib/api/discoverClient.ts";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";

export type CreateRelationshipInvitePayload = {
  horseId: string;
  relationshipType: DiscoverProviderType;
  receiverAccountId?: string;
  invitedEmail?: string;
  invitedName?: string;
  requestMessage?: string;
};

/** Horse owner sends a provider invitation. */
export async function createRelationshipInvite(
  payload: CreateRelationshipInvitePayload,
): Promise<PublicRelationship> {
  const response = await fetchWithAuth("/api/v1/relationships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseApiResponse<{ relationship: PublicRelationship }>(response);
  return data.relationship;
}


