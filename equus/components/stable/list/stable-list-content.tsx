/**
 * StableListContent — owned stables list (`/stables`).
 *
 * Auth-gated grid of the signed-in user's stables with an add-stable CTA. Data
 * comes from `useStableList`. Wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { EntityFilter, type FilterFieldConfig } from "@/components/shared/entity-filter.tsx";
import { StablePageContentSkeleton } from "@/components/stable/stable-page-content-skeleton.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useStableList } from "@/hooks/queries/useStable.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import type { StableListFilters } from "@/lib/services/stableService.ts";
import { cn } from "@/lib/utils";

export function StableListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("stable.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();

  const filters: StableListFilters = useMemo(
    () => ({
      favorites: searchParams.get("favorites") === "true" ? true : undefined,
    }),
    [searchParams],
  );

  const { data, isPending } = useStableList(filters);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/stables"));
    }
  }, [authLoading, isAuthenticated, router]);

  const filterFields: FilterFieldConfig[] = useMemo(
    () => [{ key: "favorites", label: t("favoritesLabel"), type: "toggle" }],
    [t],
  );

  function handleSearch(params: URLSearchParams) {
    if (params.toString()) {
      router.replace(`/stables?${params.toString()}`);
    } else {
      router.replace("/stables");
    }
  }

  if (isPending || authLoading) {
    return <StablePageContentSkeleton suppressHydrationWarning />;
  }

  const stables = data?.stables ?? [];

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-border bg-background px-4 py-2 text-foreground sm:px-6">
        <EntityFilter fields={filterFields} onSearch={handleSearch} />
      </div>

      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6" suppressHydrationWarning>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <Link href="/stables/new" className={cn(buttonVariants())}>
            {t("addStable")}
          </Link>
        </div>

        <SectionErrorBoundary message={t("loadFailed")}>
          {stables.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {stables.map((stable) => (
                <li key={stable.id}>
                  <Link
                    href={`/stables/${stable.id}`}
                    className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                  >
                    <span className="font-medium group-hover:text-primary">{stable.tradeName}</span>
                    {stable.city ? (
                      <span className="text-sm text-muted-foreground">
                        {[stable.city, stable.country].filter(Boolean).join(", ")}
                      </span>
                    ) : null}
                    {stable.acceptsNewHorses ? (
                      <span className="text-xs text-success">{t("acceptsNewHorses")}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </SectionErrorBoundary>
      </div>
    </>
  );
}
