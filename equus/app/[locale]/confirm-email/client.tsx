/**
 * ConfirmEmailClient — search-params hydration boundary for `/confirm-email`.
 *
 * Reads the `token` param and passes it to `ConfirmEmailContent`. This is the
 * only component in the confirm-email tree that touches `useSearchParams()`,
 * keeping `page.tsx` free of a Suspense boundary.
 */

"use client";

import { useSearchParams } from "next/navigation";

import { ConfirmEmailContent } from "@/components/auth/confirm-email-content.tsx";

export function ConfirmEmailClient() {
  const searchParams = useSearchParams();
  return <ConfirmEmailContent token={searchParams.get("token")} />;
}
