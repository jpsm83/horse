/**
 * HorsePageShell — auth and ownership gate for horse sub-page content.
 *
 * Tab chrome and content padding live in HorseLayoutChrome (layout.tsx).
 * Reads the pre-seeded horse view from TanStack cache populated by layout RSC.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { HorsePageContentSkeleton } from "@/components/horses/horse-page-content-skeleton.tsx";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { useHorseView } from "@/hooks/queries/useHorse.ts";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import type { HorseViewDto } from "@/lib/services/horseService.ts";

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
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useHorseView(horseId);

  const isLoading = isAuthLoading || isViewLoading;
  const horse = view?.horse;
  const isAdmin = horse?.isAdmin === true;
  const isMainOwner = horse?.isMainOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/horses/" + horseId));
    }
  }, [isLoading, isAuthenticated, router, horseId]);

  const blocked =
    !isLoading &&
    Boolean(horse) &&
    ((requireMainOwner && !isMainOwner) || (requireOwnership && !isAdmin));

  if (isLoading || !horse) {
    return <HorsePageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <HorsePageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">You don&apos;t have permission to view this page.</p>
        <Link
          href={"/horses/" + horseId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          Back to hub
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ horse, isOwner: isMainOwner })
  ) : (
    children
  );
}
