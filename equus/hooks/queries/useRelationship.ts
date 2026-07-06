"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicRelationship } from "@/lib/api/authClient";
import type { DiscoverProviderType } from "@/lib/api/discoverClient";

export type CreateRelationshipInvitePayload = {
  horseId: string;
  relationshipType: DiscoverProviderType;
  receiverAccountId?: string;
  invitedEmail?: string;
  invitedName?: string;
  requestMessage?: string;
};

async function fetchPendingRelationships(): Promise<PublicRelationship[]> {
  const response = await fetchWithAuth("/api/v1/users/me/relationships?status=pending");
  const data = await parseApiResponse<{ relationships: PublicRelationship[] }>(response);
  return data.relationships;
}

async function acceptRelationshipApi(relationshipId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/relationships/${relationshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    }),
  );
}

async function declineRelationshipApi(relationshipId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/relationships/${relationshipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    }),
  );
}

async function createRelationshipInvite(payload: CreateRelationshipInvitePayload): Promise<PublicRelationship> {
  const response = await fetchWithAuth("/api/v1/relationships", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseApiResponse<{ relationship: PublicRelationship }>(response);
  return data.relationship;
}

export function usePendingRelationships() {
  return useQuery({
    queryKey: queryKeys.relationships.pending(),
    queryFn: fetchPendingRelationships,
    staleTime: 15_000,
  });
}

export function useAcceptRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptRelationshipApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.pending() });
    },
  });
}

export function useDeclineRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineRelationshipApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.pending() });
    },
  });
}

export function useCreateRelationshipInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRelationshipInvite,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.relationships(data.horseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.pending() });
    },
  });
}
