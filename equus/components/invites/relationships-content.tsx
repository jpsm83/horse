/**
 * RelationshipsContent — pending horse relationship inbox (`/relationships`).
 *
 * Auth-gated list of pending relationship requests with Accept/Decline. Receives
 * `highlightRelationshipId` from `RelationshipsClient` (deep link from email).
 * Mutations are direct TanStack Query calls; list is wrapped in
 * `SectionErrorBoundary` so a crash never takes down the inbox chrome.
 */

"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { RelationshipsPageContentSkeleton } from "@/components/invites/relationships-page-content-skeleton.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { AppHomeLink } from "@/components/navigation/app-home-link.tsx";
import { useRouter } from "@/i18n/navigation.ts";
import {
  useAcceptRelationship,
  useDeclineRelationship,
} from "@/hooks/queries/useRelationship.ts";
import { useAppAuth } from "@/hooks/use-app-auth";
import { usePendingRelationships } from "@/hooks/queries/useAuthData";
import { isApiClientError } from "@/lib/api/auth/session";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

type RelationshipsContentProps = {
  highlightRelationshipId: string | null;
};

export function RelationshipsContent({
  highlightRelationshipId,
}: RelationshipsContentProps) {
  const router = useRouter();
  const t = useTranslations("invites.relationships");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const toast = useAppToast();

  const { isAuthenticated, isLoading: authLoading } = useAppAuth();
  const { data: relationships = [], isPending } = usePendingRelationships();
  const acceptMutation = useAcceptRelationship();
  const declineMutation = useDeclineRelationship();

  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const next = highlightRelationshipId
        ? `/relationships?relationship=${encodeURIComponent(highlightRelationshipId)}`
        : "/relationships";
      router.replace(buildSignInPath(next));
    }
  }, [authLoading, isAuthenticated, highlightRelationshipId, router]);

  async function handleAccept(relationshipId: string) {
    setActingId(relationshipId);

    try {
      await acceptMutation.mutateAsync(relationshipId);
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

  async function handleDecline(relationshipId: string) {
    setActingId(relationshipId);

    try {
      await declineMutation.mutateAsync(relationshipId);
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
    return <RelationshipsPageContentSkeleton suppressHydrationWarning />;
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
        {relationships.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="space-y-3">
            {relationships.map((relationship) => {
              const isHighlighted =
                highlightRelationshipId && relationship.id === highlightRelationshipId;

              return (
                <li
                  key={relationship.id}
                  id={`relationship-${relationship.id}`}
                  className={cn(
                    "rounded-lg border p-4",
                    isHighlighted && "border-primary ring-1 ring-primary/30",
                  )}
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {relationship.horseName ?? tCommon("horseFallback")} · {relationship.relationshipType}
                    </p>
                    {relationship.requesterLabel ? (
                      <p className="text-sm text-muted-foreground">
                        {tCommon("from", { label: relationship.requesterLabel })}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={actingId === relationship.id}
                      onClick={() => void handleAccept(relationship.id)}
                    >
                      {t("accept")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === relationship.id}
                      onClick={() => void handleDecline(relationship.id)}
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
