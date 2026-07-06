"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicRelationship, PublicOwnershipTransfer } from "@/lib/api/authClient";
import type { PublicWorkplace } from "@/lib/services/workplaceRelationshipService";

async function fetchPendingRelationships(): Promise<PublicRelationship[]> {
  const response = await fetchWithAuth("/api/v1/users/me/relationships?status=pending");
  const data = await parseApiResponse<{ relationships: PublicRelationship[] }>(response);
  return data.relationships;
}

async function fetchPendingOwnershipTransfers(): Promise<PublicOwnershipTransfer[]> {
  const response = await fetchWithAuth("/api/v1/users/me/ownership-transfers?status=pending");
  const data = await parseApiResponse<{ transfers: PublicOwnershipTransfer[] }>(response);
  return data.transfers;
}

async function fetchWorkplaces(): Promise<PublicWorkplace[]> {
  const response = await fetchWithAuth("/api/v1/users/me/workplaces");
  const data = await parseApiResponse<{ workplaces: PublicWorkplace[] }>(response);
  return data.workplaces;
}

async function acceptWorkplaceInvitationApi(invitationId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/users/me/workplace-invitations/${invitationId}/accept`, { method: "POST" }),
  );
}

async function declineWorkplaceInvitationApi(invitationId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/users/me/workplace-invitations/${invitationId}/decline`, { method: "POST" }),
  );
}

export function usePendingRelationships() {
  return useQuery({
    queryKey: queryKeys.relationships.pending(),
    queryFn: fetchPendingRelationships,
    staleTime: 15_000,
  });
}

export function usePendingOwnershipTransfers() {
  return useQuery({
    queryKey: queryKeys.ownershipTransfers.pending(),
    queryFn: fetchPendingOwnershipTransfers,
    staleTime: 15_000,
  });
}

export function useWorkplaces() {
  return useQuery({
    queryKey: queryKeys.users.workplaces,
    queryFn: fetchWorkplaces,
  });
}

export function useAcceptWorkplaceInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptWorkplaceInvitationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.workplaces });
    },
  });
}

export function useDeclineWorkplaceInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineWorkplaceInvitationApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.workplaces });
    },
  });
}
