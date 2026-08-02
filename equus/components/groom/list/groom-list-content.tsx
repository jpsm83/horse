/**
 * GroomListContent — owned groom profile list (`/groomers`).
 *
 * Auth-gated summary of the signed-in user's groom profile with an add CTA.
 * Data comes from `useGroomList`. Wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { GroomPageContentSkeleton } from "@/components/groom/groom-page-content-skeleton.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useGroomList } from "@/hooks/queries/useGroom.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function GroomListContent() {
  const router = useRouter();
  const t = useTranslations("groom.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useGroomList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/groomers"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <GroomPageContentSkeleton suppressHydrationWarning />;
  }

  const grooms = data?.grooms ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6" suppressHydrationWarning>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Link href="/groomers/new" className={cn(buttonVariants())}>
          {t("addGroom")}
        </Link>
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {grooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {grooms.map((groom) => (
              <li key={groom.id}>
                <Link
                  href={`/groomers/${groom.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">{groom.displayName}</span>
                  {groom.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[groom.city, groom.country].filter(Boolean).join(", ")}
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
