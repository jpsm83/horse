"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  acceptWorkplaceInvitation,
  declineWorkplaceInvitation,
  fetchPendingOwnershipTransfers,
  fetchPendingRelationships,
  fetchWorkplaces,
} from "@/lib/api/auth/invites";
import { queryKeys } from "@/lib/api/queryKeys";

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
    mutationFn: acceptWorkplaceInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.workplaces });
    },
  });
}

export function useDeclineWorkplaceInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: declineWorkplaceInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.workplaces });
    },
  });
}
