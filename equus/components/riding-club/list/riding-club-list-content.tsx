/**
 * RidingClubListContent — owned riding clubs list (`/riding-clubs`).
 *
 * Auth-gated grid of the signed-in user's riding clubs with an add-club CTA.
 * Data comes from `useRidingClubList`. Wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { RidingClubPageContentSkeleton } from "@/components/riding-club/riding-club-page-content-skeleton.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRidingClubList } from "@/hooks/queries/useRidingClub.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function RidingClubListContent() {
  const router = useRouter();
  const t = useTranslations("ridingClub.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useRidingClubList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/riding-clubs"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <RidingClubPageContentSkeleton suppressHydrationWarning />;
  }

  const ridingClubs = data?.ridingClubs ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6" suppressHydrationWarning>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Link href="/riding-clubs/new" className={cn(buttonVariants())}>
          {t("addClub")}
        </Link>
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {ridingClubs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ridingClubs.map((ridingClub) => (
              <li key={ridingClub.id}>
                <Link
                  href={`/riding-clubs/${ridingClub.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">
                    {ridingClub.clubName}
                  </span>
                  {ridingClub.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[ridingClub.city, ridingClub.country].filter(Boolean).join(", ")}
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
