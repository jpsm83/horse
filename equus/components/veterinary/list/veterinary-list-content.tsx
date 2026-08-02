/**
 * VeterinaryListContent — owned veterinary practice list (`/veterinaries`).
 *
 * Auth-gated page for the signed-in user's veterinary practice. User-linked
 * roles hold at most one profile, so it renders either the single profile card
 * or an add-veterinary CTA. Data comes from `useVeterinaryList`. Wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { VeterinaryPageContentSkeleton } from "@/components/veterinary/veterinary-page-content-skeleton.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useVeterinaryList } from "@/hooks/queries/useVeterinary.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function VeterinaryListContent() {
  const router = useRouter();
  const t = useTranslations("veterinary.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useVeterinaryList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/veterinaries"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <VeterinaryPageContentSkeleton suppressHydrationWarning />;
  }

  const veterinaries = data?.veterinaries ?? [];

  return (
    <div
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6"
      suppressHydrationWarning
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        {veterinaries.length === 0 ? (
          <Link href="/veterinaries/new" className={cn(buttonVariants())}>
            {t("addVet")}
          </Link>
        ) : null}
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {veterinaries.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {veterinaries.map((veterinary) => (
              <li key={veterinary.id}>
                <Link
                  href={`/veterinaries/${veterinary.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">
                    {veterinary.practiceName}
                  </span>
                  {veterinary.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[veterinary.city, veterinary.country].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                  {veterinary.acceptsNewPatients ? (
                    <span className="text-xs text-success">{t("acceptsNewPatients")}</span>
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
