/**
 * FarrierListContent — owned farrier profile list (`/farriers`).
 *
 * Auth-gated summary of the signed-in user's farrier profile with an add CTA.
 * Data comes from `useFarrierList`. Wrapped in `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { FarrierPageContentSkeleton } from "@/components/farrier/farrier-page-content-skeleton.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useFarrierList } from "@/hooks/queries/useFarrier.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function FarrierListContent() {
  const router = useRouter();
  const t = useTranslations("farrier.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useFarrierList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/farriers"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <FarrierPageContentSkeleton suppressHydrationWarning />;
  }

  const farriers = data?.farriers ?? [];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6" suppressHydrationWarning>
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <Link href="/farriers/new" className={cn(buttonVariants())}>
          {t("addFarrier")}
        </Link>
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {farriers.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {farriers.map((farrier) => (
              <li key={farrier.id}>
                <Link
                  href={`/farriers/${farrier.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">{farrier.displayName}</span>
                  {farrier.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[farrier.city, farrier.country].filter(Boolean).join(", ")}
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
