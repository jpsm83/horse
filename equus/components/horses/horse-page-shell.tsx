"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { EntityTabs } from "@/components/ui/entity-tabs.tsx";
import { HorseHubPageSkeleton } from "@/components/horses/horse-hub-page-skeleton.tsx";
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
  title,
  backHref,
  backLabel,
  requireOwnership,
  children,
}: HorsePageShellProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: horse, isLoading: isHorseLoading, error: horseError } = useOwnerHorse(horseId);

  const isLoading = isAuthLoading || isHorseLoading;

  if (!isLoading && !isAuthenticated) {
    router.replace(buildSignInPath(backHref ?? `/horses/${horseId}`));
    return null;
  }

  if (horseError) {
    if (isFetchError(horseError) && horseError.statusCode === 403) {
      router.push("/not-allowed?reason=wrong_account");
      return null;
    }
    router.replace("/horses");
    return null;
  }

  if (isLoading || !horse) {
    return <HorseHubPageSkeleton />;
  }

  const isOwner = horse?.isMainOwner === true;

  if (requireOwnership && !isOwner) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
        <Link href={`/horses/${horseId}`} className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground">
          Back to hub
        </Link>
      </div>
    );
  }

  const href = backHref ?? `/horses/${horseId}`;
  const label = backLabel ?? "\u2190 Back";

  return (
    <>
      <EntityTabs tabs={getHorseTabs(horseId)} isOwner={isOwner} variant="header" />
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-4 sm:py-6">
        <div className="space-y-1">
          <Link
            href={href}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline"
          >
            {label}
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </div>

        {typeof children === "function" ? children({ horse, isOwner }) : children}
      </div>
    </>
  );
}
