/**
 * FarrierLayoutChrome — persistent tab bar and content wrapper for all
 * `/farriers/[farrierId]/*` sub-pages.
 *
 * Mounted in [farrierId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot. Mirrors StableLayoutChrome.
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useFarrierView } from "@/hooks/queries/useFarrier.ts";
import { getFarrierTabs } from "@/lib/navigation/farrierTabs.ts";
import type { FarrierTab } from "@/lib/services/farrierService.ts";

type FarrierLayoutChromeProps = {
  farrierId: string;
  children: ReactNode;
};

export function FarrierLayoutChrome({ farrierId, children }: FarrierLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useFarrierView(farrierId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as FarrierTab[] | undefined;
  const isOwner = view?.farrier?.isOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getFarrierTabs(farrierId, allowedTabs)}
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
