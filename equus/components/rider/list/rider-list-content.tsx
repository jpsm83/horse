/**
 * RiderListContent — owned rider profile list (`/riders`).
 *
 * Auth-gated card for the signed-in user's single rider profile (user-linked:
 * at most one per user) with an add-rider CTA. Data comes from `useRiderList`.
 * Wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { RiderPageContentSkeleton } from "@/components/rider/rider-page-content-skeleton.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRiderList } from "@/hooks/queries/useRider.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function RiderListContent() {
  const router = useRouter();
  const t = useTranslations("rider.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useRiderList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/riders"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <RiderPageContentSkeleton suppressHydrationWarning />;
  }

  const riders = data?.riders ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6" suppressHydrationWarning>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        {riders.length === 0 ? (
          <Link href="/riders/new" className={cn(buttonVariants())}>
            {t("addRider")}
          </Link>
        ) : null}
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {riders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {riders.map((rider) => (
              <li key={rider.id}>
                <Link
                  href={`/riders/${rider.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">{rider.displayName}</span>
                  {rider.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[rider.city, rider.country].filter(Boolean).join(", ")}
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
