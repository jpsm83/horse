/**
 * RiderLayoutChrome — persistent tab bar and content wrapper for all
 * `/riders/[riderId]/*` sub-pages.
 *
 * Mounted in [riderId]/layout.tsx so EntityTabs survive route transitions and
 * loading.tsx only replaces the children slot. Mirrors StableLayoutChrome but
 * gates tabs on the user-linked `isOwner` flag (no admin tab).
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRiderView } from "@/hooks/queries/useRider.ts";
import { getRiderTabs } from "@/lib/navigation/riderTabs.ts";
import type { RiderTab } from "@/lib/services/riderService.ts";

type RiderLayoutChromeProps = {
  riderId: string;
  children: ReactNode;
};

export function RiderLayoutChrome({ riderId, children }: RiderLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useRiderView(riderId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as RiderTab[] | undefined;
  const isOwner = view?.rider?.isOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getRiderTabs(riderId, allowedTabs)}
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
