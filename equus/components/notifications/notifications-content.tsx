/**
 * NotificationsContent — in-app notification inbox (`/notifications`).
 *
 * Distinct from the account Notifications tab (`/user/[userId]/notifications`),
 * which manages email opt-ins only. Auth-gated paginated list with mark-read.
 */

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { NotificationsPageContentSkeleton } from "@/components/notifications/notifications-page-content-skeleton.tsx";
import { AppHomeLink } from "@/components/navigation/app-home-link.tsx";
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
  const tCommon = useTranslations("common");
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
      // Keep the UI stable on failure; no toast wired here.
    }
  }

  if (isPending || authLoading) {
    return <NotificationsPageContentSkeleton suppressHydrationWarning />;
  }

  const notifications = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      footer={
        <AppHomeLink className="font-medium text-foreground underline-offset-4 hover:underline">
          {tCommon("home")}
        </AppHomeLink>
      }
    >
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
        <div className="flex items-center gap-2 pt-2">
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
    </AuthPageShell>
  );
}
