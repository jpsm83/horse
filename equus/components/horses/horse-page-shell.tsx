/**
 * HorsePageShell — shared chrome for all horse sub-pages.
 *
 * Reads the pre-seeded horse view from the TanStack cache (populated by layout.tsx RSC).
 * Renders the tab bar immediately and gates ownership-required content once auth resolves.
 * No data fetching here — the layout handles that via HydrationBoundary.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { UnsavedChangesProvider } from "@/components/shared/unsaved-changes-context.tsx";
import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { getHorseTabs } from "@/lib/navigation/horseTabs.ts";
import { useHorseView } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import type { HorseViewDto, HorseTab } from "@/lib/services/horseService.ts";

export type HorsePageShellRenderProps = {
  horse: HorseViewDto;
  isOwner: boolean;
};

type HorsePageShellProps = {
  horseId: string;
  requireOwnership?: boolean;
  requireMainOwner?: boolean;
  children: ReactNode | ((props: HorsePageShellRenderProps) => ReactNode);
};

export function HorsePageShell({
  horseId,
  requireOwnership,
  requireMainOwner,
  children,
}: HorsePageShellProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useHorseView(horseId);

  const isLoading = isAuthLoading || isViewLoading;
  const horse = view?.horse;
  const allowedTabs = view?.allowedTabs as HorseTab[] | undefined;
  const isAdmin = horse?.isAdmin === true;
  const isMainOwner = horse?.isMainOwner === true;

  // Auth redirect — only after loading resolves
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/horses/" + horseId));
    }
  }, [isLoading, isAuthenticated, router, horseId]);

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  const blocked =
    !isLoading &&
    horse &&
    ((requireMainOwner && !isMainOwner) || (requireOwnership && !isAdmin));

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
      <div className="mx-auto flex w-full flex-1 flex-col gap-4 p-4 sm:p-6 sm:gap-6">
        {isLoading || !horse ? (
          <HorsePageSkeleton suppressHydrationWarning />
        ) : blocked ? (
          <div className="mx-auto p-6">
            <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
            <Link
              href={"/horses/" + horseId}
              className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
            >
              Back to hub
            </Link>
          </div>
        ) : typeof children === "function" ? (
          children({ horse, isOwner: isMainOwner })
        ) : (
          children
        )}
      </div>
    </UnsavedChangesProvider>
  );
}
