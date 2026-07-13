"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptRelationship,
  declineRelationship,
  fetchPendingRelationships,
} from "@/lib/api/auth/invites";
import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicRelationship } from "@/lib/services/relationshipService";
import type { DiscoverProviderType } from "@/lib/api/discoverClient";

export type CreateRelationshipInvitePayload = {
  horseId: string;
  relationshipType: DiscoverProviderType;
  receiverAccountId?: string;
  invitedEmail?: string;
  invitedName?: string;
  requestMessage?: string;
};

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
    mutationFn: acceptRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.pending() });
    },
  });
}

export function useDeclineRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineRelationship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.pending() });
    },
  });
}

async function endRelationship(relationshipId: string): Promise<PublicRelationship> {
  const response = await fetchWithAuth(`/api/v1/relationships/${relationshipId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ended" }),
  });
  const data = await parseApiResponse<{ relationship: PublicRelationship }>(response);
  return data.relationship;
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

async function cancelSentInvite(relationshipId: string): Promise<PublicRelationship> {
  const response = await fetchWithAuth(`/api/v1/relationships/${relationshipId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  const data = await parseApiResponse<{ relationship: PublicRelationship }>(response);
  return data.relationship;
}

export function useCancelSentInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSentInvite,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.providers(data.horseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.relationships(data.horseId) });
    },
  });
}

export function useEndRelationship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endRelationship,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.relationships.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.providers(data.horseId) });
    },
  });
}
