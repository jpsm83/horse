"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { PublicRelationship } from "@/lib/services/relationshipService";
import type { CreateHorsePayload } from "@/lib/utils/horseFormMapping";
import type { PublicOwnershipTransfer } from "@/lib/services/ownershipTransferService";
import type { HorseListResult, HorseListFilters, HorseViewResponse } from "@/lib/services/horseService.ts";
import type {
  HorseHubGalleryPage,
  HubGalleryTypeFilter,
} from "@/lib/services/mediaService.ts";

// --- Horse view (unified role-aware chrome — no Hub social lists) ---

async function fetchHorseView(horseId: string): Promise<HorseViewResponse> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}`);
  return parseApiResponse<HorseViewResponse>(response);
}

export function useHorseView(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.view(horseId!),
    queryFn: () => fetchHorseView(horseId!),
    enabled: !!horseId,
    placeholderData: (previousData) => previousData,
    // Deliberate deviation from the global retry: 1 — this public, role-aware
    // view 404s for ineligible viewers (Layer-1 deny). Retrying would hammer the
    // server pointlessly; the Hub/tab shells render the not-found state instead.
    retry: false,
  });
}

// --- Paginated Hub Media gallery ---

async function fetchHorseHubGallery(
  horseId: string,
  params: { page: number; pageSize: number; type: HubGalleryTypeFilter },
): Promise<HorseHubGalleryPage> {
  const search = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    type: params.type,
  });
  const response = await fetchWithAuth(
    `/api/v1/horses/${encodeURIComponent(horseId)}/hub-gallery?${search}`,
  );
  return parseApiResponse<HorseHubGalleryPage>(response);
}

export function useHorseHubGallery(
  horseId: string | undefined,
  params: { page: number; pageSize: number; type: HubGalleryTypeFilter },
) {
  return useQuery({
    queryKey: queryKeys.horses.hubGallery(horseId!, params),
    queryFn: () => fetchHorseHubGallery(horseId!, params),
    enabled: !!horseId && params.pageSize > 0,
    placeholderData: (previousData) => previousData,
  });
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

export function useHorsePendingRelationships(horseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.horses.relationships(horseId!),
    queryFn: () => fetchPendingRelationships(horseId!),
    enabled: !!horseId,
    placeholderData: (previousData) => previousData,
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

async function fetchProviders(horseId: string, status?: string): Promise<PublicRelationship[]> {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(horseId)}/providers${params}`);
  const data = await parseApiResponse<{ relationships: PublicRelationship[] }>(response);
  return data.relationships;
}

export function useHorseProviders(horseId: string | undefined, status?: "accepted" | "ended") {
  return useQuery({
    queryKey: [...queryKeys.horses.providers(horseId!), status ?? "all"] as const,
    queryFn: () => fetchProviders(horseId!, status),
    enabled: !!horseId,
    placeholderData: (previousData) => previousData,
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

// --- Update Horse ---

type UpdateHorseInput = { horseId: string; patch: Record<string, unknown> };

async function updateHorseApi(input: UpdateHorseInput): Promise<void> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(input.horseId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.patch),
  });
  await parseApiResponse<{ horse: Record<string, unknown> }>(response);
}

export function useUpdateHorse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHorseApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.view(variables.horseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() });
    },
  });
}

// --- Update Horse Sale ---

type UpdateHorseSaleInput = { horseId: string; patch: Record<string, unknown> };

async function updateHorseSaleApi(input: UpdateHorseSaleInput): Promise<void> {
  const response = await fetchWithAuth(`/api/v1/horses/${encodeURIComponent(input.horseId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.patch),
  });
  await parseApiResponse<{ horse: Record<string, unknown> }>(response);
}

export function useUpdateHorseSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHorseSaleApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.view(variables.horseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() });
    },
  });
}

// --- Update Horse Visibility Layer-1 (API: PATCH …/discovery) ---

type UpdateHorseVisibilityInput = {
  horseId: string;
  patch: Record<string, unknown>;
};

async function updateHorseVisibilityApi(input: UpdateHorseVisibilityInput): Promise<void> {
  const response = await fetchWithAuth(
    `/api/v1/horses/${encodeURIComponent(input.horseId)}/discovery`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input.patch),
    },
  );
  await parseApiResponse<{ horse: Record<string, unknown> }>(response);
}

export function useUpdateHorseVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHorseVisibilityApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.view(variables.horseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.lists() });
    },
  });
}

import type { HubSectionKey } from "@/lib/horses/hubSections.ts";

// --- Update Hub section visibility Layer-2 (API: PATCH …/hub-sections) ---

type UpdateHorseHubSectionInput = {
  horseId: string;
  sectionKey: HubSectionKey;
  mode: "public" | "relationship" | "owner";
};

async function updateHorseHubSectionApi(input: UpdateHorseHubSectionInput): Promise<void> {
  const response = await fetchWithAuth(
    `/api/v1/horses/${encodeURIComponent(input.horseId)}/hub-sections`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hubSections: { [input.sectionKey]: { mode: input.mode } },
      }),
    },
  );
  await parseApiResponse<{ horse: Record<string, unknown> }>(response);
}

export function useUpdateHorseHubSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHorseHubSectionApi,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.horses.view(variables.horseId) });
    },
  });
}

