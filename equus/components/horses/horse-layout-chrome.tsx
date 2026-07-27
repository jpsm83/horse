/**
 * HorseLayoutChrome — persistent tab bar and content wrapper for all horse sub-pages.
 *
 * Mounted in [horseId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot.
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { getHorseTabs } from "@/lib/navigation/horseTabs.ts";
import { useHorseView } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import type { HorseTab } from "@/lib/services/horseService.ts";

type HorseLayoutChromeProps = {
  horseId: string;
  children: ReactNode;
};

export function HorseLayoutChrome({ horseId, children }: HorseLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useHorseView(horseId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as HorseTab[] | undefined;
  const horse = view?.horse;
  const isAdmin = horse?.isAdmin === true;
  const isMainOwner = horse?.isMainOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getHorseTabs(horseId, allowedTabs)}
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
