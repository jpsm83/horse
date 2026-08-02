/**
 * VeterinaryLayoutChrome — persistent tab bar and content wrapper for all
 * `/veterinaries/[veterinaryId]/*` sub-pages.
 *
 * Mounted in [veterinaryId]/layout.tsx so EntityTabs survive route transitions
 * and loading.tsx only replaces the children slot. Mirrors StableLayoutChrome.
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useVeterinaryView } from "@/hooks/queries/useVeterinary.ts";
import { getVeterinaryTabs } from "@/lib/navigation/veterinaryTabs.ts";
import type { VeterinaryTab } from "@/lib/services/veterinaryService.ts";

type VeterinaryLayoutChromeProps = {
  veterinaryId: string;
  children: ReactNode;
};

export function VeterinaryLayoutChrome({
  veterinaryId,
  children,
}: VeterinaryLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useVeterinaryView(veterinaryId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as VeterinaryTab[] | undefined;
  const isOwner = view?.veterinary?.isOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getVeterinaryTabs(veterinaryId, allowedTabs)}
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
