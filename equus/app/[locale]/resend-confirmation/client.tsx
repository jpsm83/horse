/**
 * ResendConfirmationClient — thin client boundary for `/resend-confirmation`.
 *
 * `/resend-confirmation` uses no search params, so this wrapper exists purely to
 * keep the route structure consistent with the other auth pages (thin
 * `page.tsx` → `client.tsx` → content component).
 */

"use client";

import { ResendConfirmationContent } from "@/components/auth/resend-confirmation-content.tsx";

export function ResendConfirmationClient() {
  return <ResendConfirmationContent />;
}
