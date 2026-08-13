/**
 * StablePageShell — auth and ownership gate for stable sub-page content.
 *
 * Tab chrome and content padding live in StableLayoutChrome (layout.tsx). Reads
 * the stable view via `useStableView` (`GET /api/v1/stables/:id`).
 * Requires authentication for non-hub tabs; gates admin behind `requireMainOwner`.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { StablePageContentSkeleton } from "@/components/stable/stable-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useStableView } from "@/hooks/queries/useStable.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { StableViewDto } from "@/lib/services/stableService.ts";

export type StablePageShellRenderProps = {
  stable: StableViewDto;
  isOwner: boolean;
};

type StablePageShellProps = {
  stableId: string;
  requireOwnership?: boolean;
  requireMainOwner?: boolean;
  children: ReactNode | ((props: StablePageShellRenderProps) => ReactNode);
};

export function StablePageShell({
  stableId,
  requireOwnership,
  requireMainOwner,
  children,
}: StablePageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useStableView(stableId);

  const isLoading = isAuthLoading || isViewLoading;
  const stable = view?.stable;
  const isAdmin = stable?.isAdmin === true;
  const isMainOwner = stable?.isMainOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/stables/" + stableId));
    }
  }, [isLoading, isAuthenticated, router, stableId]);

  const blocked =
    !isLoading &&
    Boolean(stable) &&
    ((requireMainOwner && !isMainOwner) || (requireOwnership && !isAdmin));

  if (isLoading || !stable) {
    return <StablePageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <StablePageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/stables/" + stableId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ stable, isOwner: isMainOwner })
  ) : (
    children
  );
}
