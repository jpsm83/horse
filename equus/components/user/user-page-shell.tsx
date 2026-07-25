/**
 * UserPageShell — shared layout for account sub-pages (`/user/[userId]/…`).
 *
 * Reads the pre-seeded TanStack cache (populated by layout.tsx RSC via HydrationBoundary).
 * Renders tabs immediately; auth + self-ownership gating via side effects.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { UserPageSkeleton } from "@/components/user/user-page-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserView } from "@/hooks/queries/useCurrentUser.ts";
import { useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import {
  getUserTabs,
  userProfilePath,
} from "@/lib/navigation/userTabs.ts";

type UserPageShellProps = {
  userId: string;
  onDiscard?: () => void;
  children: ReactNode;
};

export function UserPageShell({ userId, onDiscard, children }: UserPageShellProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const t = useTranslations("header");
  const tAccount = useTranslations("header.account");
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAppAuth();

  // Reads from HydrationBoundary cache — no extra fetch when layout.tsx RSC succeeded.
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

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
      onDiscard={onDiscard}
    >
      <EntityTabs
        tabs={getUserTabs(userId, {
          hub: tAccount("hub"),
          profile: t("profile"),
          preferences: tAccount("preferences"),
          notifications: tAccount("notifications"),
          workplace: tAccount("workplaces"),
          relationships: tAccount("relationships"),
          subscription: tAccount("subscription"),
        })}
        isAdmin
        isPending={isLoading}
      />
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:p-6 sm:gap-6">
        {showContent ? children : <UserPageSkeleton suppressHydrationWarning />}
      </div>
    </UnsavedChangesProvider>
  );
}
