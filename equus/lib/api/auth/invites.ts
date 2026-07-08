import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import type { InviteRefPreview } from "@/lib/services/invitePreviewService";
import type { PublicOwnershipTransfer } from "@/lib/services/ownershipTransferService";
import type { PublicRelationship } from "@/lib/services/relationshipService";
import type { PublicWorkplace } from "@/lib/services/workplaceRelationshipService";

// --- Workplaces ---

export async function fetchWorkplaces(): Promise<PublicWorkplace[]> {
  const data = await parseApiResponse<{ workplaces: PublicWorkplace[] }>(
    await fetchWithAuth("/api/v1/users/me/workplaces"),
  );
  return data.workplaces;
}

export async function acceptWorkplaceInvitation(invitationId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/users/me/workplace-invitations/${invitationId}/accept`, { method: "POST" }),
  );
}

export async function declineWorkplaceInvitation(invitationId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/users/me/workplace-invitations/${invitationId}/decline`, { method: "POST" }),
  );
}

// --- Relationships ---

export async function fetchPendingRelationships(): Promise<PublicRelationship[]> {
  const response = await fetchWithAuth("/api/v1/users/me/relationships?status=pending");
  const data = await parseApiResponse<{ relationships: PublicRelationship[] }>(response);
  return data.relationships;
}

export async function acceptRelationship(relationshipId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/relationships/${relationshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    }),
  );
}

export async function declineRelationship(relationshipId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/relationships/${relationshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    }),
  );
}

// --- Ownership Transfers ---

export async function fetchPendingOwnershipTransfers(): Promise<PublicOwnershipTransfer[]> {
  const response = await fetchWithAuth("/api/v1/users/me/ownership-transfers?status=pending");
  const data = await parseApiResponse<{ transfers: PublicOwnershipTransfer[] }>(response);
  return data.transfers;
}

export async function acceptOwnershipTransfer(transferId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/ownership-transfers/${transferId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    }),
  );
}

export async function declineOwnershipTransfer(transferId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/ownership-transfers/${transferId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    }),
  );
}

// --- Invite Preview ---

export async function resolveInviteRef(ref: string): Promise<InviteRefPreview | null> {
  const response = await fetchWithAuth(`/api/v1/invites/preview?ref=${encodeURIComponent(ref)}`);

  if (response.status === 404) {
    return null;
  }

  const data = await parseApiResponse<{ preview: InviteRefPreview }>(response);
  return data.preview;
}
