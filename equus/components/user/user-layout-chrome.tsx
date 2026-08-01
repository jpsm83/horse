/**
 * UserLayoutChrome — persistent tab bar + content wrapper for all /user/[userId] sub-pages.
 *
 * Mounted in [userId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot. Wraps UnsavedChangesProvider so
 * EntityTabs can intercept tab navigation when a form is dirty (mirrors
 * HorseLayoutChrome).
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserView } from "@/hooks/queries/useCurrentUser.ts";
import { getUserTabs } from "@/lib/navigation/userTabs.ts";

type UserLayoutChromeProps = {
  userId: string;
  children: ReactNode;
};

export function UserLayoutChrome({ userId, children }: UserLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const t = useTranslations("header");
  const tAccount = useTranslations("header.account");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { isLoading: isViewLoading } = useUserView(userId);

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
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
        isPending={isAuthLoading || isViewLoading}
      />
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        {children}
      </div>
    </UnsavedChangesProvider>
  );
}
