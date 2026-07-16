/**
 * HorseConnectPageContent — unified connection management tab.
 *
 * Two sections:
 * 1. Invite Provider: search all entity types + email fallback
 * 2. Connections table: self-contained with its own loading, error, and data states
 *
 * Business rule: Only registered Equus users can be invited directly.
 * Email invites create pending relationships that activate upon signup.
 */

"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { EntitySearch } from "@/components/horses/entity-search.tsx";
import { ConnectionsTableSection } from "@/components/horses/connections-table-section.tsx";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { queryKeys } from "@/lib/api/queryKeys";

type Props = { horseId: string };

export function HorseConnectPageContent({ horseId }: Props) {
  const t = useTranslations("horseConnect");
  const toast = useAppToast();
  const queryClient = useQueryClient();

  function handleInvite(result: { id: string; name: string; email: string; entityType: string }) {
    fetch(`/api/v1/horses/${horseId}/relationships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverAccountId: result.id,
        relationshipType: result.entityType,
      }),
    }).then((res) => {
      if (res.ok) {
        toast.success(t("invitationSent"));
        queryClient.invalidateQueries({ queryKey: queryKeys.horses.relationships(horseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.horses.providers(horseId) });
      } else {
        toast.error(t("invitationCancelled"));
      }
    });
  }

  function handleEmailInvite(email: string, name?: string) {
    fetch(`/api/v1/horses/${horseId}/relationships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        invitedEmail: email,
        invitedName: name,
      }),
    }).then((res) => {
      if (res.ok) {
        toast.success(t("invitationSent"));
        queryClient.invalidateQueries({ queryKey: queryKeys.horses.relationships(horseId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.horses.providers(horseId) });
      } else {
        toast.error(t("invitationCancelled"));
      }
    });
  }

  return (
    <HorsePageShell horseId={horseId} requireOwnership>
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">{t("inviteSection")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <EntitySearch
          horseId={horseId}
          onInvite={handleInvite}
          onEmailInvite={handleEmailInvite}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{t("connectionsSection")}</h2>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <InlineErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
          )}
        >
          <ConnectionsTableSection horseId={horseId} />
        </ErrorBoundary>
      </section>
    </HorsePageShell>
  );
}
