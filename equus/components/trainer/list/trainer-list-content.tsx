/**
 * TrainerListContent — owned trainer profile list (`/trainers`).
 *
 * Auth-gated page for the signed-in user's trainer profile. User-linked roles
 * hold at most one profile, so it renders either the single profile card or an
 * add-trainer CTA. Data comes from `useTrainerList`. Wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { TrainerPageContentSkeleton } from "@/components/trainer/trainer-page-content-skeleton.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useTrainerList } from "@/hooks/queries/useTrainer.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function TrainerListContent() {
  const router = useRouter();
  const t = useTranslations("trainer.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useTrainerList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/trainers"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <TrainerPageContentSkeleton suppressHydrationWarning />;
  }

  const trainers = data?.trainers ?? [];

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
        {trainers.length === 0 ? (
          <Link href="/trainers/new" className={cn(buttonVariants())}>
            {t("addTrainer")}
          </Link>
        ) : null}
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {trainers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {trainers.map((trainer) => (
              <li key={trainer.id}>
                <Link
                  href={`/trainers/${trainer.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">
                    {trainer.displayName}
                  </span>
                  {trainer.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[trainer.city, trainer.country].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                  {trainer.acceptsNewClients ? (
                    <span className="text-xs text-success">{t("acceptsNewClients")}</span>
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
