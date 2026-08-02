/**
 * TransportListContent — owned transports list (`/transport`).
 *
 * Auth-gated grid of the signed-in user's transport companies with an
 * add-transport CTA. Data comes from `useTransportList`. Wrapped in
 * `SectionErrorBoundary`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { TransportPageContentSkeleton } from "@/components/transport/transport-page-content-skeleton.tsx";
import { buttonVariants } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useTransportList } from "@/hooks/queries/useTransport.ts";
import { Link, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

export function TransportListContent() {
  const router = useRouter();
  const t = useTranslations("transport.list");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data, isPending } = useTransportList();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/transport"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (isPending || authLoading) {
    return <TransportPageContentSkeleton suppressHydrationWarning />;
  }

  const transports = data?.transports ?? [];

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
        <Link href="/transport/new" className={cn(buttonVariants())}>
          {t("addTransport")}
        </Link>
      </div>

      <SectionErrorBoundary message={t("loadFailed")}>
        {transports.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {transports.map((transport) => (
              <li key={transport.id}>
                <Link
                  href={`/transport/${transport.id}`}
                  className="group flex flex-col gap-1 rounded-xl border bg-card p-4 shadow-sm transition-all hover:border-primary/25 hover:shadow-md"
                >
                  <span className="font-medium group-hover:text-primary">
                    {transport.companyName}
                  </span>
                  {transport.city ? (
                    <span className="text-sm text-muted-foreground">
                      {[transport.city, transport.country].filter(Boolean).join(", ")}
                    </span>
                  ) : null}
                  {transport.acceptsNewBookings ? (
                    <span className="text-xs text-success">{t("acceptsNewBookings")}</span>
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
