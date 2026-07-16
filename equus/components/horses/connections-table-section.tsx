/**
 * ConnectionsTableSection — self-contained table for the Connect tab.
 *
 * Owns data fetching, loading skeleton, and end/cancel mutations.
 * Errors are caught by the parent ErrorBoundary wrapper.
 */

"use client";

import { useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";

import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useHorseProviders, useHorsePendingRelationships } from "@/hooks/queries/useHorse.ts";
import { useEndRelationship, useCancelSentInvite } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { relationshipTypeEnums } from "@/utils/enums";
import { relationshipTypeFilterOptions, relationshipStatusFilterOptions } from "@/utils/filter-options";

type Props = { horseId: string };

type ConnectionRow = {
  id: string;
  type: string;
  status: "accepted" | "pending" | "refused" | "ended";
  name: string;
  email: string;
  since: string;
};

export function ConnectionsTableSection({ horseId }: Props) {
  const t = useTranslations("horseConnect");
  const tTypes = useTranslations("invites.horseProviders.types");
  const toast = useAppToast();

  const { data: currentProviders = [], isPending: isProvidersPending } = useHorseProviders(horseId, "accepted");
  const { data: pendingRelationships = [], isPending: isRelationshipsPending } = useHorsePendingRelationships(horseId);
  const endMutation = useEndRelationship();
  const cancelMutation = useCancelSentInvite();

  const isPending = isProvidersPending || isRelationshipsPending;

  const handleEnd = useCallback((relationshipId: string, status: "accepted" | "pending") => {
    const mutation = status === "accepted" ? endMutation : cancelMutation;
    mutation.mutate(relationshipId, {
      onSuccess: () => toast.success(status === "accepted" ? t("connectionEnded") : t("invitationCancelled")),
      onError: () => toast.error(t("invitationCancelled")),
    });
  }, [endMutation, cancelMutation, toast, t]);

  const dropdownOptionsByColumnKey = useMemo(() => ({
    type: relationshipTypeFilterOptions,
    status: relationshipStatusFilterOptions,
  }), []);

  const columns: DataTableColumnDef<ConnectionRow>[] = useMemo(() => [
    { id: "type", accessorKey: "type", header: t("tableType"), enableSorting: true, filterType: "dropdown" },
    { id: "status", accessorKey: "status", header: t("tableStatus"), enableSorting: true, filterType: "dropdown" },
    { id: "name", accessorKey: "name", header: t("tableName"), enableSorting: true, filterType: "input", meta: { debounceMs: 300 } },
    { id: "email", accessorKey: "email", header: t("tableEmail"), filterType: "input", meta: { debounceMs: 300 } },
    { id: "since", accessorKey: "since", header: t("tableSince"), enableSorting: true, filterType: "input", meta: { dataType: "date", debounceMs: 300 } },
    {
      id: "actions",
      header: t("tableActions"),
      cell: ({ row }) => {
        const r = row.original;
        if (r.status === "accepted") {
          return (
              <Button variant="outline" size="sm" onClick={() => handleEnd(r.id, "accepted")}>
              {t("endConnection")}
            </Button>
          );
        }
        if (r.status === "pending") {
          return (
              <Button variant="outline" size="sm" onClick={() => handleEnd(r.id, "pending")}>
              {t("cancelInvitation")}
            </Button>
          );
        }
        return null;
      },
    },
  ], [t, handleEnd]);

  if (isPending) {
    return <Skeleton className="h-[400px] w-full rounded-lg" />;
  }

  const allRelationships = [...currentProviders, ...pendingRelationships];

  const rows: ConnectionRow[] = allRelationships.map((rel) => ({
    id: rel.id,
    type: rel.relationshipType && relationshipTypeEnums.includes(rel.relationshipType as never) ? tTypes(rel.relationshipType) : t("typeUnknown"),
    status: rel.status as ConnectionRow["status"],
    name: rel.receiverLabel ?? rel.invitedEmail ?? "-",
    email: rel.invitedEmail ?? "-",
    since: rel.respondedAt
      ? new Date(rel.respondedAt).toLocaleDateString()
      : rel.requestedAt
        ? new Date(rel.requestedAt).toLocaleDateString()
        : "-",
  }));

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableSorting
      enableFiltering
      emptyStateMessage={t("noResults")}
      dropdownOptionsByColumnKey={dropdownOptionsByColumnKey}
    />
  );
}
