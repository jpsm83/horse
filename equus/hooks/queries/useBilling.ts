/**
 * TanStack Query hooks for stable entity subscription billing.
 *
 * `useEntityBilling` reads subscription state for a stable (`GET /api/v1/billing/current?stableId=`).
 * Checkout and portal mutations require `stableId` in the body.
 */

"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { EntityBillingDto } from "@/lib/billing/entitySubscription.ts";
import type { BillingCurrencyCode } from "@/lib/billing/entityCatalog.ts";

type CheckoutResponse = { url: string };

async function fetchEntityBilling(stableId: string): Promise<EntityBillingDto> {
  const response = await fetchWithAuth(
    `/api/v1/billing/current?stableId=${encodeURIComponent(stableId)}`,
  );
  return parseApiResponse<EntityBillingDto>(response);
}

export function useEntityBilling(stableId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.entity(stableId),
    queryFn: () => fetchEntityBilling(stableId),
    staleTime: 30_000,
    enabled: enabled && Boolean(stableId),
  });
}

export function useCreateEntityCheckout() {
  return useMutation({
    mutationFn: ({
      stableId,
      currency = "EUR",
    }: {
      stableId: string;
      currency?: BillingCurrencyCode;
    }) =>
      fetchWithAuth("/api/v1/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stableId, currency }),
      }).then((response) => parseApiResponse<CheckoutResponse>(response)),
  });
}

export function useEntityStripePortal() {
  return useMutation({
    mutationFn: (stableId: string) =>
      fetchWithAuth("/api/v1/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stableId }),
      }).then((response) => parseApiResponse<CheckoutResponse>(response)),
  });
}

export type { EntityBillingDto };
