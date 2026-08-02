/**
 * RidingClubLayoutChrome — persistent tab bar and content wrapper for all
 * `/riding-clubs/[clubId]/*` sub-pages.
 *
 * Mounted in [clubId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot. Mirrors StableLayoutChrome.
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRidingClubView } from "@/hooks/queries/useRidingClub.ts";
import { getRidingClubTabs } from "@/lib/navigation/ridingClubTabs.ts";
import type { RidingClubTab } from "@/lib/services/ridingClubService.ts";

type RidingClubLayoutChromeProps = {
  clubId: string;
  children: ReactNode;
};

export function RidingClubLayoutChrome({ clubId, children }: RidingClubLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useRidingClubView(clubId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as RidingClubTab[] | undefined;
  const ridingClub = view?.ridingClub;
  const isAdmin = ridingClub?.isAdmin === true;
  const isMainOwner = ridingClub?.isMainOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getRidingClubTabs(clubId, allowedTabs)}
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
