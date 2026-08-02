/**
 * Legacy `/profile` bookmark — redirects to `/user/{id}/profile`.
 *
 * Client component because it needs the REST auth session (`useAppAuth`) to
 * resolve the current user id before redirecting. Unauthenticated users are
 * sent to sign-in with the `/profile` destination preserved. Called by the
 * `[locale]` layout via `AppShell`; the canonical settings pages live under
 * `app/[locale]/user/[userId]/profile`.
 */

"use client";

import { useEffect } from "react";

import { UserPageContentSkeleton } from "@/components/user/user-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { userProfilePath } from "@/lib/navigation/userTabs.ts";

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAppAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace(buildSignInPath("/profile"));
      return;
    }

    router.replace(userProfilePath(user.id));
  }, [isLoading, isAuthenticated, user, router]);

  return <UserPageContentSkeleton suppressHydrationWarning />;
}
