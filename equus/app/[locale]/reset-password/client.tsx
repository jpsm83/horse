/**
 * ResetPasswordClient — search-params hydration boundary for `/reset-password`.
 *
 * Reads the `token` param and clears any existing REST session before showing
 * the reset form (a signed-in user resetting a password must not stay
 * authenticated). While the session clears, the shared auth skeleton renders so
 * the SSR output does not flash. Passes the resolved `token` to
 * `ResetPasswordContent`.
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AuthPageContentSkeleton } from "@/components/auth/auth-page-content-skeleton.tsx";
import { ResetPasswordContent } from "@/components/auth/reset-password-content.tsx";
import { clearClientAuthSession } from "@/lib/auth/clearClientAuthSession.ts";
import { useRouter } from "@/i18n/navigation.ts";

export function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [ready, setReady] = useState(!token);

  useEffect(() => {
    if (!token) return;
    clearClientAuthSession().then(() => {
      router.refresh();
      setReady(true);
    });
  }, [token, router]);

  if (!ready) {
    return <AuthPageContentSkeleton suppressHydrationWarning />;
  }

  return <ResetPasswordContent token={token} />;
}
