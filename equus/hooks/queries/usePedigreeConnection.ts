"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicPedigreeConnection } from "@/lib/services/pedigreeConnectionService";

export type CreatePedigreeConnectionInput = {
  childHorseId: string;
  role: "sire" | "dam";
  parentHorseId?: string;
  parentHorseName?: string;
  invitedEmail?: string;
};

async function createPedigreeConnectionApi(
  input: CreatePedigreeConnectionInput,
): Promise<PublicPedigreeConnection> {
  const data = await parseApiResponse<{ connection: PublicPedigreeConnection }>(
    await fetchWithAuth("/api/v1/pedigree-connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.connection;
}

async function fetchPendingPedigreeConnections(): Promise<PublicPedigreeConnection[]> {
  const data = await parseApiResponse<{ connections: PublicPedigreeConnection[] }>(
    await fetchWithAuth("/api/v1/users/me/pedigree-connections?status=pending"),
  );
  return data.connections;
}

async function acceptPedigreeConnection(connectionId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/pedigree-connections/${connectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    }),
  );
}

async function declinePedigreeConnection(connectionId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/pedigree-connections/${connectionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    }),
  );
}

export function usePendingPedigreeConnections() {
  return useQuery({
    queryKey: queryKeys.pedigreeConnections.pending(),
    queryFn: fetchPendingPedigreeConnections,
    staleTime: 15_000,
  });
}

export function useCreatePedigreeConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPedigreeConnectionApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pedigreeConnections.pending() });
    },
  });
}

export function useAcceptPedigreeConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptPedigreeConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pedigreeConnections.pending() });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.all });
    },
  });
}

export function useDeclinePedigreeConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declinePedigreeConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pedigreeConnections.pending() });
    },
  });
}
