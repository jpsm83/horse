/**
 * ForgotPasswordClient — thin client boundary for `/forgot-password`.
 *
 * `/forgot-password` uses no search params, so this wrapper exists purely to
 * keep the route structure consistent with the other auth pages (thin
 * `page.tsx` → `client.tsx` → content component).
 */

"use client";

import { ForgotPasswordContent } from "@/components/auth/forgot-password-content.tsx";

export function ForgotPasswordClient() {
  return <ForgotPasswordContent />;
}
