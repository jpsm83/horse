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
import { Skeleton } from "@/components/ui/skeleton.tsx";
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
  title: string;
  backHref?: string;
  backLabel?: string;
  requireOwnership?: boolean;
  children: ReactNode | ((props: HorsePageShellRenderProps) => ReactNode);
};

export function HorsePageShell({
  horseId,
  requireOwnership,
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

  const isOwner = horse?.isMainOwner ?? true;

  return (
    <>
      <EntityTabs tabs={getHorseTabs(horseId)} isOwner={isOwner} variant="header" />
        <div className="mx-auto flex w-full flex-1 flex-col gap-8 px-4 py-4 sm:py-6" suppressHydrationWarning>

        {isLoading || !horse ? (
          <Skeleton className="h-full w-full rounded-lg bg-green-800" />
        ) : requireOwnership && !(horse.isMainOwner === true) ? (
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


