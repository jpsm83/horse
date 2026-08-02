/**
 * CoachListContent — owned coach profile list (`/coaches`).
 *
 * Auth-gated card for the signed-in user's single coach profile (user-linked:
 * at most one per user) with an add-coach CTA. Data comes from `useCoachList`.
 * Wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { CoachPageContentSkeleton } from "@/components/coach/coach-page-content-skeleton.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useCoachList } from "@/hooks/queries/useCoach.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function CoachListContent() {
  const router = useRouter();
  const t = useTranslations("coach.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useCoachList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/coaches"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <CoachPageContentSkeleton suppressHydrationWarning />;
  }

  const coaches = data?.coaches ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6" suppressHydrationWarning>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        {coaches.length === 0 ? (
          <Link href="/coaches/new" className={cn(buttonVariants())}>
            {t("addCoach")}
          </Link>
        ) : null}
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {coaches.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {coaches.map((coach) => (
              <li key={coach.id}>
                <Link
                  href={`/coaches/${coach.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">{coach.displayName}</span>
                  {coach.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[coach.city, coach.country].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionErrorBoundary>
    </div>
  );
}
