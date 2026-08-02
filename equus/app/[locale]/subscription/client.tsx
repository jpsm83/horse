/**
 * SubscriptionClient — thin client boundary for `/subscription`.
 *
 * `/subscription` uses no search params, so this wrapper exists purely to keep
 * the route structure consistent with the rest of the app (thin `page.tsx` →
 * `client.tsx` → content component).
 */

"use client";

import { SubscriptionPageContent } from "@/components/billing/subscription-page-content.tsx";

export function SubscriptionClient() {
  return <SubscriptionPageContent />;
}
