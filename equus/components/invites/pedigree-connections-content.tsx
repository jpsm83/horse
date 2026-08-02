/**
 * PedigreeConnectionsContent — pending pedigree connection inbox
 * (`/pedigree-connections`).
 *
 * Auth-gated list of pending pedigree acknowledgment requests with
 * Accept/Decline. Receives `highlightConnectionId` from
 * `PedigreeConnectionsClient` (deep link from email). Mutations are direct
 * TanStack Query calls; list is wrapped in `SectionErrorBoundary` so a crash
 * never takes down the inbox chrome.
 */

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { PedigreeConnectionsPageContentSkeleton } from "@/components/invites/pedigree-connections-page-content-skeleton.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { AppHomeLink } from "@/components/navigation/app-home-link.tsx";
import { useRouter } from "@/i18n/navigation.ts";
import {
  useAcceptPedigreeConnection,
  useDeclinePedigreeConnection,
  usePendingPedigreeConnections,
} from "@/hooks/queries/usePedigreeConnection.ts";
import { useAppAuth } from "@/hooks/use-app-auth";
import { isApiClientError } from "@/lib/api/auth/session";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

type PedigreeConnectionsContentProps = {
  highlightConnectionId: string | null;
};

export function PedigreeConnectionsContent({
  highlightConnectionId,
}: PedigreeConnectionsContentProps) {
  const router = useRouter();
  const t = useTranslations("invites.pedigreeConnections");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const toast = useAppToast();

  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data: connections = [], isPending } = usePendingPedigreeConnections();
  const acceptMutation = useAcceptPedigreeConnection();
  const declineMutation = useDeclinePedigreeConnection();

  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const next = highlightConnectionId
        ? `/pedigree-connections?connection=${encodeURIComponent(highlightConnectionId)}`
        : "/pedigree-connections";
      router.replace(buildSignInPath(next));
    }
  }, [authLoading, isAuthenticated, highlightConnectionId, router]);

  async function handleAccept(connectionId: string) {
    setActingId(connectionId);
    try {
      await acceptMutation.mutateAsync(connectionId);
      toast.success(t("accepted"));
    } catch (err) {
      if (isApiClientError(err) && err.statusCode === 403) {
        router.push("/not-allowed?reason=wrong_account");
        return;
      }
      toast.error(err instanceof Error ? err.message : tStatus("requestFailed"));
    } finally {
      setActingId(null);
    }
  }

  async function handleDecline(connectionId: string) {
    setActingId(connectionId);
    try {
      await declineMutation.mutateAsync(connectionId);
      toast.success(t("declined"));
    } catch (err) {
      if (isApiClientError(err) && err.statusCode === 403) {
        router.push("/not-allowed?reason=wrong_account");
        return;
      }
      toast.error(err instanceof Error ? err.message : tStatus("requestFailed"));
    } finally {
      setActingId(null);
    }
  }

  if (isPending || authLoading) {
    return <PedigreeConnectionsPageContentSkeleton suppressHydrationWarning />;
  }

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
        {connections.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {connections.map((connection) => {
              const isHighlighted =
                highlightConnectionId && connection.id === highlightConnectionId;

              return (
                <li
                  key={connection.id}
                  id={`pedigree-connection-${connection.id}`}
                  className={cn(
                    "rounded-lg border p-4",
                    isHighlighted && "border-primary ring-1 ring-primary/30",
                  )}
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {t(`roles.${connection.role}` as "roles.sire")} ·{" "}
                      {connection.parentHorseName ?? t("unknownParent")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("childLine", {
                        childName: connection.childHorseName ?? t("unknownChild"),
                      })}
                    </p>
                    {connection.initiatorLabel ? (
                      <p className="text-sm text-muted-foreground">
                        {tCommon("from", { label: connection.initiatorLabel })}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">{t("ackHint")}</p>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={actingId === connection.id}
                      onClick={() => void handleAccept(connection.id)}
                    >
                      {t("accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === connection.id}
                      onClick={() => void handleDecline(connection.id)}
                    >
                      {t("decline")}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SectionErrorBoundary>
    </AuthPageShell>
  );
}
