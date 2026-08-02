/**
 * RidingClubPageShell — auth and ownership gate for riding club sub-page content.
 *
 * Tab chrome and content padding live in RidingClubLayoutChrome (layout.tsx).
 * Reads the pre-seeded club view from the TanStack cache populated by layout RSC.
 * Requires authentication for non-hub tabs; gates admin behind `requireMainOwner`.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { RidingClubPageContentSkeleton } from "@/components/riding-club/riding-club-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRidingClubView } from "@/hooks/queries/useRidingClub.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { RidingClubViewDto } from "@/lib/services/ridingClubService.ts";

export type RidingClubPageShellRenderProps = {
  ridingClub: RidingClubViewDto;
  isOwner: boolean;
};

type RidingClubPageShellProps = {
  clubId: string;
  requireOwnership?: boolean;
  requireMainOwner?: boolean;
  children: ReactNode | ((props: RidingClubPageShellRenderProps) => ReactNode);
};

export function RidingClubPageShell({
  clubId,
  requireOwnership,
  requireMainOwner,
  children,
}: RidingClubPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useRidingClubView(clubId);

  const isLoading = isAuthLoading || isViewLoading;
  const ridingClub = view?.ridingClub;
  const isAdmin = ridingClub?.isAdmin === true;
  const isMainOwner = ridingClub?.isMainOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/riding-clubs/" + clubId));
    }
  }, [isLoading, isAuthenticated, router, clubId]);

  const blocked =
    !isLoading &&
    Boolean(ridingClub) &&
    ((requireMainOwner && !isMainOwner) || (requireOwnership && !isAdmin));

  if (isLoading || !ridingClub) {
    return <RidingClubPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <RidingClubPageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/riding-clubs/" + clubId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ ridingClub, isOwner: isMainOwner })
  ) : (
    children
  );
}
