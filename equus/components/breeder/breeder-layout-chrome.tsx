/**
 * BreederLayoutChrome — persistent tab bar and content wrapper for all
 * `/breeders/[breederId]/*` sub-pages.
 *
 * Mounted in [breederId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot. Mirrors StableLayoutChrome.
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useBreederView } from "@/hooks/queries/useBreeder.ts";
import { getBreederTabs } from "@/lib/navigation/breederTabs.ts";
import type { BreederTab } from "@/lib/services/breederService.ts";

type BreederLayoutChromeProps = {
  breederId: string;
  children: ReactNode;
};

export function BreederLayoutChrome({ breederId, children }: BreederLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useBreederView(breederId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as BreederTab[] | undefined;
  const breeder = view?.breeder;
  const isAdmin = breeder?.isAdmin === true;
  const isMainOwner = breeder?.isMainOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getBreederTabs(breederId, allowedTabs)}
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
