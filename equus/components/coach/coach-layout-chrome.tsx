/**
 * CoachLayoutChrome — persistent tab bar and content wrapper for all
 * `/coaches/[coachId]/*` sub-pages.
 *
 * Mounted in [coachId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot. Mirrors StableLayoutChrome but
 * gates tabs on the user-linked `isOwner` flag (no admin tab).
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useCoachView } from "@/hooks/queries/useCoach.ts";
import { getCoachTabs } from "@/lib/navigation/coachTabs.ts";
import type { CoachTab } from "@/lib/services/coachService.ts";

type CoachLayoutChromeProps = {
  coachId: string;
  children: ReactNode;
};

export function CoachLayoutChrome({ coachId, children }: CoachLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useCoachView(coachId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as CoachTab[] | undefined;
  const isOwner = view?.coach?.isOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getCoachTabs(coachId, allowedTabs)}
        isAdmin={isOwner}
        isMainOwner={isOwner}
        isPending={isLoading}
      />
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        {children}
      </div>
    </UnsavedChangesProvider>
  );
}
