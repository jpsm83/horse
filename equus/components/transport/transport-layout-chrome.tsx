/**
 * TransportLayoutChrome — persistent tab bar and content wrapper for all
 * `/transport/[transportId]/*` sub-pages.
 *
 * Mounted in [transportId]/layout.tsx so EntityTabs survive route transitions
 * and loading.tsx only replaces the children slot. Mirrors StableLayoutChrome.
 */

"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useTransportView } from "@/hooks/queries/useTransport.ts";
import { getTransportTabs } from "@/lib/navigation/transportTabs.ts";
import type { TransportTab } from "@/lib/services/transportService.ts";

type TransportLayoutChromeProps = {
  transportId: string;
  children: ReactNode;
};

export function TransportLayoutChrome({
  transportId,
  children,
}: TransportLayoutChromeProps) {
  const tCommon = useTranslations("common");
  const { isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useTransportView(transportId);

  const isLoading = isAuthLoading || isViewLoading;
  const allowedTabs = view?.allowedTabs as TransportTab[] | undefined;
  const transport = view?.transport;
  const isAdmin = transport?.isAdmin === true;
  const isMainOwner = transport?.isMainOwner === true;

  return (
    <UnsavedChangesProvider
      dialogTitle={tCommon("unsavedChangesTitle")}
      dialogDescription={tCommon("unsavedChangesDescription")}
      stayLabel={tCommon("stayOnPage")}
      leaveLabel={tCommon("leaveWithoutSaving")}
    >
      <EntityTabs
        tabs={getTransportTabs(transportId, allowedTabs)}
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
