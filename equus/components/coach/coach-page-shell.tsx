/**
 * CoachPageShell — auth and user-linked ownership gate for coach sub-page
 * content.
 *
 * Tab chrome and content padding live in CoachLayoutChrome (layout.tsx). Reads
 * the pre-seeded coach view from the TanStack cache populated by layout RSC.
 * Gates on `isAuthenticated` and the view DTO's `isOwner` flag (computed by the
 * service when `coach.userId === user.id`). There is no co-owner/admin logic —
 * user-linked profiles have exactly one owner.
 */

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "@/i18n/navigation.ts";
import { useTranslations } from "next-intl";

import { CoachPageContentSkeleton } from "@/components/coach/coach-page-content-skeleton.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useCoachView } from "@/hooks/queries/useCoach.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { CoachViewDto } from "@/lib/services/coachService.ts";

export type CoachPageShellRenderProps = {
  coach: CoachViewDto;
  isOwner: boolean;
};

type CoachPageShellProps = {
  coachId: string;
  requireOwnership?: boolean;
  children: ReactNode | ((props: CoachPageShellRenderProps) => ReactNode);
};

export function CoachPageShell({
  coachId,
  requireOwnership,
  children,
}: CoachPageShellProps) {
  const t = useTranslations("common");
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: view, isLoading: isViewLoading } = useCoachView(coachId);

  const isLoading = isAuthLoading || isViewLoading;
  const coach = view?.coach;
  const isOwner = coach?.isOwner === true;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(buildSignInPath("/coaches/" + coachId));
    }
  }, [isLoading, isAuthenticated, router, coachId]);

  const blocked = !isLoading && Boolean(coach) && requireOwnership && !isOwner;

  if (isLoading || !coach) {
    return <CoachPageContentSkeleton suppressHydrationWarning />;
  }

  if (!isAuthenticated) {
    return <CoachPageContentSkeleton suppressHydrationWarning />;
  }

  if (blocked) {
    return (
      <div className="mx-auto p-6">
        <p className="text-muted-foreground">{t("permissionDenied")}</p>
        <Link
          href={"/coaches/" + coachId}
          className="text-sm font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {t("backToHub")}
        </Link>
      </div>
    );
  }

  return typeof children === "function" ? (
    children({ coach, isOwner })
  ) : (
    children
  );
}
