/**
 * TanStack Query hooks for subscription billing data.
 *
 * `useBilling` reads current plan usage (`GET /api/v1/billing/current`).
 * `useCreateCheckout` opens a Stripe Checkout session for a tier.
 * `useStripePortal` opens the Stripe Customer Portal.
 */

"use client";

import { useMutation, useQuery } from "@tanstack/react-query";

import { fetchWithAuth, parseApiResponse } from "@/lib/api/fetchWithAuth";
import { queryKeys } from "@/lib/api/queryKeys";
import type { TierId } from "@/lib/billing/plans";

type BillingUsage = {
  current: number;
  limit: number;
  tierId: TierId;
  remaining: number;
};

type CheckoutResponse = { url: string };

export type { BillingUsage };

async function fetchBilling(): Promise<BillingUsage> {
  const response = await fetchWithAuth("/api/v1/billing/current");
  return parseApiResponse<BillingUsage>(response);
}

export function useBilling(enabled = true) {
  return useQuery({
    queryKey: queryKeys.billing.current,
    queryFn: fetchBilling,
    staleTime: 30_000,
    enabled,
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: (tierId: TierId) =>
      fetchWithAuth("/api/v1/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      }).then((response) => parseApiResponse<CheckoutResponse>(response)),
  });
}

export function useStripePortal() {
  return useMutation({
    mutationFn: () =>
      fetchWithAuth("/api/v1/billing/portal", { method: "POST" }).then((response) =>
        parseApiResponse<CheckoutResponse>(response),
      ),
  });
}
