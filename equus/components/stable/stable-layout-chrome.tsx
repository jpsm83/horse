/**
 * StableLayoutChrome — persistent tab bar and content wrapper for all
 * `/stables/[stableId]/*` sub-pages.
 *
 * Mounted in [stableId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot. Mirrors HorseLayoutChrome.
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useStableView } from "@/hooks/queries/useStable.ts";
import { getStableTabs } from "@/lib/navigation/stableTabs.ts";
import type { StableTab } from "@/lib/services/stableService.ts";

type StableLayoutChromeProps = {
  stableId: string;
  children: ReactNode;
};

export function StableLayoutChrome({ stableId, children }: StableLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useStableView(stableId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as StableTab[] | undefined;
  const stable = view?.stable;
  const isAdmin = stable?.isAdmin === true;
  const isMainOwner = stable?.isMainOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getStableTabs(stableId, allowedTabs)}
        isAdmin={isAdmin}
        isMainOwner={isMainOwner}
        isPending={isLoading}
      />
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
        {children}
      </div>
    </UnsavedChangesProvider>
  );
}
