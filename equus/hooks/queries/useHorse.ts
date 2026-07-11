"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicRelationship } from "@/lib/services/relationshipService";
import type { CreateHorsePayload } from "@/lib/utils/horseFormMapping";
import type { PublicOwnershipTransfer } from "@/lib/services/ownershipTransferService";
import type { OwnerHorseSummary } from "@/lib/api/horseClient";
import type { HorseListResult, HorseListFilters } from "@/lib/services/horseService.ts";

async function fetchOwnerHorse(horseId: string): Promise<OwnerHorseSummary> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/owner`);
  const data = await parseApiResponse<{ horse: OwnerHorseSummary }>(response);
  return data.horse;
}

export type CreatedHorseResponse = {
  _id: string;
  name: string;
  breed: string;
  sex: string;
  mainOwnerUserId: string;
  createdByUserId: string;
};

async function createHorseApi(input: CreateHorsePayload) {
  const response = await fetchWithAuth("/api/v1/horses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ horse: CreatedHorseResponse }>(response);
}

async function fetchPendingRelationships(horseId: string): Promise<PublicRelationship[]> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/relationships?status=pending`);
  const data = await parseApiResponse<{ relationships: PublicRelationship[] }>(response);
  return data.relationships;
}

async function fetchOwnershipTransfers(horseId: string): Promise<PublicOwnershipTransfer[]> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/ownership-transfers?status=pending`);
  const data = await parseApiResponse<{ transfers: PublicOwnershipTransfer[] }>(response);
  return data.transfers;
}

async function fetchHorseList(filters: HorseListFilters): Promise<HorseListResult> {
  const params = new URLSearchParams();
  if (filters.mine) params.set("mine", "true");
  if (filters.forSale) params.set("forSale", "true");
  if (filters.breed) params.set("breed", filters.breed);
  if (filters.sex) params.set("sex", filters.sex);
  if (filters.countryOfBirth) params.set("countryOfBirth", filters.countryOfBirth);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();

  const response = await fetch(`/api/v1/horses${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  return parseApiResponse<HorseListResult>(response);
}

export function useHorseList(filters: HorseListFilters = {}) {
  return useQuery({
    queryKey: [...queryKeys.horses.lists(), filters],
    queryFn: () => fetchHorseList(filters),
  });
}

export function useOwnerHorse(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.owner(horseId!),
    queryFn: () => fetchOwnerHorse(horseId!),
    enabled: !!horseId,
  });
}

export function useHorsePendingRelationships(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.relationships(horseId!),
    queryFn: () => fetchPendingRelationships(horseId!),
    enabled: !!horseId,
  });
}

export function useHorseOwnershipTransfers(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.ownershipTransfers(horseId!),
    queryFn: () => fetchOwnershipTransfers(horseId!),
    enabled: !!horseId,
  });
}

async function fetchOwnershipHistory(horseId: string): Promise<PublicOwnershipTransfer[]> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/ownership-history`);
  const data = await parseApiResponse<{ transfers: PublicOwnershipTransfer[] }>(response);
  return data.transfers;
}

export function useHorseOwnershipHistory(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.ownershipHistory(horseId!),
    queryFn: () => fetchOwnershipHistory(horseId!),
    enabled: !!horseId,
  });
}

export function useCreateHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHorseApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() });
    },
  });
}
