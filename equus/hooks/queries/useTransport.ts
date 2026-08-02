/**
 * TanStack Query hooks for transport companies.
 *
 * `useTransportView(transportId)` reads the role-scoped transport view seeded by
 * the detail `layout.tsx` RSC (falls back to REST on miss). `useTransportList`
 * reads the authenticated user's owned transport companies. `useCreateTransport`
 * creates a transport company and invalidates the list cache.
 */

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type {
  CreateTransportInput,
  TransportListResult,
  TransportViewResponse,
} from "@/lib/services/transportService";

async function fetchTransportView(transportId: string): Promise<TransportViewResponse> {
  const response = await fetchWithAuth(`/api/v1/transports/${encodeURIComponent(transportId)}`);
  const data = await parseApiResponse<{ transport: TransportViewResponse }>(response);
  return data.transport;
}

export function useTransportView(transportId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.transports.view(transportId!),
    queryFn: () => fetchTransportView(transportId!),
    staleTime: 60_000,
    enabled: !!transportId,
  });
}

async function fetchTransportList(): Promise<TransportListResult> {
  const response = await fetchWithAuth("/api/v1/transports?mine=true");
  return parseApiResponse<TransportListResult>(response);
}

export function useTransportList() {
  return useQuery({
    queryKey: queryKeys.transports.lists(),
    queryFn: fetchTransportList,
    staleTime: 30_000,
  });
}

async function createTransportApi(input: CreateTransportInput) {
  const response = await fetchWithAuth("/api/v1/transports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseApiResponse<{ transport: { _id: string } }>(response);
}

export function useCreateTransport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransportApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.transports.lists() });
    },
  });
}
