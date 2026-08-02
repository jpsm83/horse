/**
 * BreederListContent — owned breeders list (`/breeders`).
 *
 * Auth-gated grid of the signed-in user's breeders with an add-breeder CTA.
 * Data comes from `useBreederList`. Wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { BreederPageContentSkeleton } from "@/components/breeder/breeder-page-content-skeleton.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useBreederList } from "@/hooks/queries/useBreeder.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function BreederListContent() {
  const router = useRouter();
  const t = useTranslations("breeder.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useBreederList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/breeders"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <BreederPageContentSkeleton suppressHydrationWarning />;
  }

  const breeders = data?.breeders ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6" suppressHydrationWarning>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Link href="/breeders/new" className={cn(buttonVariants())}>
          {t("addBreeder")}
        </Link>
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {breeders.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {breeders.map((breeder) => (
              <li key={breeder.id}>
                <Link
                  href={`/breeders/${breeder.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">{breeder.operationName}</span>
                  {breeder.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[breeder.city, breeder.country].filter(Boolean).join(", ")}
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
