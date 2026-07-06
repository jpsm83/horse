"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicOwnershipTransfer } from "@/lib/api/authClient";

export type CreateOwnershipTransferInput = {
  entityType: "horse" | "stable" | "breeder" | "transport" | "ridingClub";
  entityId: string;
  transferKind: "transfer_main" | "remove_co_owner" | "promote_co_owner";
  receiverUserId?: string;
  targetCoOwnerUserId?: string;
  invitedEmail?: string;
  invitedName?: string;
};

async function createOwnershipTransferApi(input: CreateOwnershipTransferInput): Promise<PublicOwnershipTransfer> {
  const data = await parseApiResponse<{ transfer: PublicOwnershipTransfer }>(
    await fetchWithAuth("/api/v1/ownership-transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return data.transfer;
}

async function acceptOwnershipTransferApi(transferId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/ownership-transfers/${transferId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "accepted" }),
    }),
  );
}

async function declineOwnershipTransferApi(transferId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/ownership-transfers/${transferId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "declined" }),
    }),
  );
}

async function cancelOwnershipTransferApi(transferId: string): Promise<void> {
  await parseApiResponse(
    await fetchWithAuth(`/api/v1/ownership-transfers/${transferId}`, { method: "DELETE" }),
  );
}

export function useCreateOwnershipTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOwnershipTransferApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ownershipTransfers.pending() });
    },
  });
}

export function useAcceptOwnershipTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptOwnershipTransferApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ownershipTransfers.pending() });
    },
  });
}

export function useDeclineOwnershipTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineOwnershipTransferApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ownershipTransfers.pending() });
    },
  });
}

export function useCancelOwnershipTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOwnershipTransferApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ownershipTransfers.pending() });
    },
  });
}
