/**
 * UserPageShell — auth and self-ownership gate for /user/[userId] sub-page content.
 *
 * Tab chrome and content padding live in UserLayoutChrome (layout.tsx).
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";

import { UserPageContentSkeleton } from "@/components/user/user-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserView } from "@/hooks/queries/useCurrentUser.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { userProfilePath } from "@/lib/navigation/userTabs.ts";

type UserPageShellProps = {
  userId: string;
  children: ReactNode;
};

export function UserPageShell({ userId, children }: UserPageShellProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAppAuth();

  // useUserView → REST; loading.tsx / shell skeleton cover first paint.
  const { isLoading: isViewLoading } = useUserView(userId);

  useEffect(() => {
    if (isAuthLoading) return;

    if (!isAuthenticated || !user) {
      router.replace(buildSignInPath(userProfilePath(userId)));
      return;
    }

    if (user.id !== userId) {
      router.replace(userProfilePath(user.id));
    }
  }, [isAuthLoading, isAuthenticated, user, userId, router]);

  const isSelf = Boolean(user && user.id === userId);
  const isLoading = isAuthLoading || isViewLoading;
  const showContent = !isLoading && isAuthenticated && isSelf;

  return showContent ? (
    children
  ) : (
    <UserPageContentSkeleton suppressHydrationWarning />
  );
}
