/**
 * GroomLayoutChrome — persistent tab bar and content wrapper for all
 * `/groomers/[groomId]/*` sub-pages.
 *
 * Mounted in [groomId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot. Mirrors StableLayoutChrome.
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useGroomView } from "@/hooks/queries/useGroom.ts";
import { getGroomTabs } from "@/lib/navigation/groomTabs.ts";
import type { GroomTab } from "@/lib/services/groomService.ts";

type GroomLayoutChromeProps = {
  groomId: string;
  children: ReactNode;
};

export function GroomLayoutChrome({ groomId, children }: GroomLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useGroomView(groomId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as GroomTab[] | undefined;
  const isOwner = view?.groom?.isOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getGroomTabs(groomId, allowedTabs)}
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
