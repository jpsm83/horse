"use client";

/**
 * Legacy `/profile` bookmark — redirects to `/user/{id}/profile`.
 */

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
