/**
 * HorsePageShell — shared layout for all horse sub-pages.
 *
 * Renders the chrome (tabs) immediately and defers auth/ownership gating
 * to the content area only. Redirects are handled as side effects so they
 * never block rendering. The tab bar communicates the current location.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { EntityTabs } from "@/components/shared/entity-tabs.tsx";
import { HorsePageSkeleton } from "@/components/horses/horse-page-skeleton.tsx";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { getHorseTabs } from "@/lib/navigation/horseTabs.ts";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { isFetchError } from "@/lib/api/fetchWithAuth";

type HorsePageShellRenderProps = {
  horse: Exclude<ReturnType<typeof useOwnerHorse>["data"], undefined>;
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
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: horse, isLoading: isHorseLoading, error: horseError } = useOwnerHorse(horseId);

  const isLoading = isAuthLoading || isHorseLoading;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace(buildSignInPath("/horses/" + horseId));
      return;
    }

    if (horseError) {
      if (isFetchError(horseError) && horseError.statusCode === 403) {
        router.push("/not-allowed?reason=wrong_account");
      } else {
        router.replace("/horses");
      }
      return;
    }
  }, [isLoading, isAuthenticated, horseError, router, horseId]);

  const shouldRedirect = !isLoading && !isAuthenticated;

  if (shouldRedirect) {
    return null;
  }

  const isMainOwner = horse?.isMainOwner ?? false;
  const isAdmin = horse?.isAdmin ?? false;

  const blocked =
    (requireMainOwner && !isMainOwner) || (requireOwnership && !isAdmin);

  return (
    <>
      <EntityTabs tabs={getHorseTabs(horseId)} isAdmin={isAdmin} isMainOwner={isMainOwner} isPending={isLoading} />
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
        ) : (
          typeof children === "function"
            ? children({ horse, isOwner: horse.isMainOwner === true })
            : children
        )}
      </div>
    </>
  );
}


