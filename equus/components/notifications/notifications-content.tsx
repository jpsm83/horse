/**
 * NotificationsContent — user notification inbox (`/notifications`).
 *
 * Auth-gated paginated list of notifications with a mark-read action. Data goes
 * through TanStack Query hooks (`useNotifications`, `useMarkNotificationRead`).
 * List is wrapped in `SectionErrorBoundary` so a crash never takes down the page.
 */

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { NotificationsPageContentSkeleton } from "@/components/notifications/notifications-page-content-skeleton.tsx";
import { Button } from "@/components/ui/button";
import { useAppAuth } from "@/hooks/use-app-auth";
import { useMarkNotificationRead, useNotifications } from "@/hooks/queries/useNotification.ts";
import { useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

function formatRelative(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString();
}

export function NotificationsContent() {
  const router = useRouter();
  const t = useTranslations("notifications");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const [page, setPage] = useState(1);
  const { data, isPending } = useNotifications(page);
  const markRead = useMarkNotificationRead();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/notifications"));
    }
  }, [authLoading, isAuthenticated, router]);

  async function handleMarkRead(id: string) {
    try {
      await markRead.mutateAsync(id);
    } catch {
      // Toast fallback is not wired here; keep the UI stable on failure.
    }
  }

  if (isPending || authLoading) {
    return <NotificationsPageContentSkeleton suppressHydrationWarning />;
  }

  const notifications = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-4 py-8"
      suppressHydrationWarning
    >
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>

      <SectionErrorBoundary message={t("loadFailed")}>
        {notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="space-y-2">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "rounded-lg border p-3",
                  !n.isRead && "border-primary/30 bg-primary/5",
                )}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                <p className="mt-0.5 text-xs text-muted-foreground/70">
                  {formatRelative(n.createdAt)}
                </p>
                {!n.isRead ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1"
                    disabled={markRead.isPending}
                    onClick={() => void handleMarkRead(n.id)}
                  >
                    {t("markRead")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </SectionErrorBoundary>

      {totalPages > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("pageOf", { page, total: totalPages })}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {t("next")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
