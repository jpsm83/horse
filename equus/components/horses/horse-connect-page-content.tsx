/**
 * HorseConnectPageContent — unified connection management tab.
 *
 * Two sections:
 * 1. Invite Provider: search all entity types + email fallback
 * 2. Connections table: all relationships with type, status, actions
 *
 * Business rule: Only registered Equus users can be invited directly.
 * Email invites create pending relationships that activate upon signup.
 */

"use client";

import { useTranslations } from "next-intl";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { EntitySearch } from "@/components/ui/entity-search.tsx";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { Button } from "@/components/ui/button";
import { useHorseProviders, useHorsePendingRelationships } from "@/hooks/queries/useHorse.ts";
import { useEndRelationship } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

type Props = { horseId: string };

type ConnectionRow = {
  id: string;
  type: string;
  status: "accepted" | "pending" | "refused" | "ended";
  name: string;
  email: string;
  since: string;
};

export function HorseConnectPageContent({ horseId }: Props) {
  const t = useTranslations("horseConnect");
  const tTypes = useTranslations("invites.horseProviders.types");
  const toast = useAppToast();
  const { data: currentProviders = [] } = useHorseProviders(horseId, "accepted");
  const { data: pendingRelationships = [] } = useHorsePendingRelationships(horseId);
  const endMutation = useEndRelationship();

  const allRelationships = [...currentProviders, ...pendingRelationships];

  const rows: ConnectionRow[] = allRelationships.map((rel) => ({
    id: rel.id,
    type: tTypes(rel.relationshipType),
    status: rel.status as ConnectionRow["status"],
    name: rel.receiverLabel ?? rel.invitedEmail ?? "-",
    email: rel.invitedEmail ?? "-",
    since: rel.respondedAt
      ? new Date(rel.respondedAt).toLocaleDateString()
      : rel.requestedAt
        ? new Date(rel.requestedAt).toLocaleDateString()
        : "-",
  }));

  function handleEnd(relationshipId: string) {
    endMutation.mutate(relationshipId, {
      onSuccess: () => toast.success(t("connectionEnded")),
      onError: () => toast.error(t("invitationCancelled")),
    });
  }

  function handleInvite(result: { id: string; name: string; email: string; entityType: string }) {
    fetch(`/api/v1/horses/${horseId}/relationships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverAccountId: result.id,
        relationshipType: result.entityType,
      }),
    }).then((res) => {
      if (res.ok) toast.success(t("invitationSent"));
      else toast.error(t("invitationCancelled"));
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
      if (res.ok) toast.success(t("invitationSent"));
      else toast.error(t("invitationCancelled"));
    });
  }

  const columns: ColumnDef<ConnectionRow>[] = [
    {
      id: "type",
      header: t("tableType"),
      accessorFn: (row) => row.type,
      sortable: true,
      filterable: true,
    },
    {
      id: "status",
      header: t("tableStatus"),
      accessorFn: (row) => row.status,
      sortable: true,
    },
    {
      id: "name",
      header: t("tableName"),
      accessorFn: (row) => row.name,
      sortable: true,
      filterable: true,
    },
    {
      id: "email",
      header: t("tableEmail"),
      accessorFn: (row) => row.email,
      filterable: true,
    },
    {
      id: "since",
      header: t("tableSince"),
      accessorFn: (row) => row.since,
      sortable: true,
    },
  ];

  return (
    <HorsePageShell horseId={horseId} title={t("title")} requireOwnership>
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
        <DataTable
          columns={columns}
          data={rows}
          filterPlaceholder={t("searchPlaceholder")}
          emptyMessage={t("noResults")}
          onRowAction={(row) =>
            row.status === "accepted" ? (
              <Button variant="outline" size="sm" onClick={() => handleEnd(row.id)}>
                {t("endConnection")}
              </Button>
            ) : row.status === "pending" ? (
              <Button variant="outline" size="sm" onClick={() => handleEnd(row.id)}>
                {t("cancelInvitation")}
              </Button>
            ) : null
          }
        />
      </section>
    </HorsePageShell>
  );
}
