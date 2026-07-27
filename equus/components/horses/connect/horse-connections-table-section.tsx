/**
 * HorseConnectionsTableSection — Connect tab connections table.
 *
 * Shares Admin History DataTable helpers / props.
 */

"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import {
  DataTable,
  initialsFromLabel,
  TableRowAction,
  TableUserAvatarCell,
  type DataTableColumnDef,
} from "@/components/table";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog.tsx";
import { HorseConnectionsTableSkeleton } from "@/components/horses/connect/horse-connections-table-skeleton.tsx";
import { useHorseProviders, useHorsePendingRelationships } from "@/hooks/queries/useHorse.ts";
import { useEndRelationship, useCancelSentInvite } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { relationshipTypeEnums } from "@/utils/enums";
import { relationshipTypeFilterOptions, relationshipStatusFilterOptions } from "@/utils/filter-options";

type Props = { horseId: string };

type ConnectionStatus = "accepted" | "pending" | "refused" | "ended";

type ConnectionRow = {
  id: string;
  userImageUrl?: string;
  userInitials: string;
  type: string;
  status: ConnectionStatus;
  name: string;
  email: string;
  since: string;
};

type ActionTarget = {
  id: string;
  status: "accepted" | "pending";
  name: string;
};

const COLUMN_ORDER = [
  "user",
  "type",
  "status",
  "name",
  "email",
  "since",
  "action",
] as const;

export function HorseConnectionsTableSection({ horseId }: Props) {
  const t = useTranslations("horseConnect");
  const tTypes = useTranslations("invites.horseProviders.types");
  const toast = useAppToast();

  const {
    data: currentProviders = [],
    isPending: isProvidersPending,
    isError: isProvidersError,
  } = useHorseProviders(horseId, "accepted");
  const {
    data: pendingRelationships = [],
    isPending: isRelationshipsPending,
    isError: isRelationshipsError,
  } = useHorsePendingRelationships(horseId);
  const endMutation = useEndRelationship();
  const cancelMutation = useCancelSentInvite();
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);

  const isPending = isProvidersPending || isRelationshipsPending;
  const isActionPending = endMutation.isPending || cancelMutation.isPending;
  const hasError = isProvidersError || isRelationshipsError;

  function formatStatus(status: ConnectionStatus): string {
    switch (status) {
      case "accepted":
        return t("statusActive");
      case "pending":
        return t("statusPending");
      case "refused":
        return t("statusRefused");
      case "ended":
        return t("statusEnded");
      default:
        return status;
    }
  }

  function formatType(relationshipType: string): string {
    if (relationshipTypeEnums.includes(relationshipType as never)) {
      return tTypes(relationshipType);
    }
    return t("typeUnknown");
  }

  function handleConfirmAction() {
    if (!actionTarget) return;
    const { id, status } = actionTarget;
    const mutation = status === "accepted" ? endMutation : cancelMutation;
    mutation.mutate(id, {
      onSuccess: () => {
        toast.success(status === "accepted" ? t("connectionEnded") : t("invitationCancelled"));
        setActionTarget(null);
      },
      onError: () =>
        toast.error(
          status === "accepted" ? t("connectionEndFailed") : t("invitationCancelFailed"),
        ),
    });
  }

  const dropdownOptionsByColumnKey = useMemo(
    () => ({
      type: relationshipTypeFilterOptions,
      status: relationshipStatusFilterOptions,
    }),
    [],
  );

  const columns: DataTableColumnDef<ConnectionRow>[] = useMemo(
    () => [
      {
        id: "user",
        accessorKey: "userInitials",
        header: t("tableUser"),
        enableSorting: false,
        cell: ({ row }) => (
          <TableUserAvatarCell
            imageUrl={row.original.userImageUrl}
            initials={row.original.userInitials}
          />
        ),
      },
      {
        id: "type",
        accessorKey: "type",
        header: t("tableType"),
        enableSorting: true,
        filterType: "dropdown",
        cell: ({ row }) => formatType(row.original.type),
      },
      {
        id: "status",
        accessorKey: "status",
        header: t("tableStatus"),
        enableSorting: true,
        filterType: "dropdown",
        cell: ({ row }) => formatStatus(row.original.status),
      },
      {
        id: "name",
        accessorKey: "name",
        header: t("tableName"),
        enableSorting: true,
        filterType: "input",
      },
      {
        id: "email",
        accessorKey: "email",
        header: t("tableEmail"),
        filterType: "input",
      },
      {
        id: "since",
        accessorKey: "since",
        header: t("tableSince"),
        enableSorting: true,
        filterType: "input",
        meta: { dataType: "date" },
      },
      {
        id: "action",
        header: t("tableActions"),
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          if (r.status === "accepted") {
            return (
              <TableRowAction
                onClick={() =>
                  setActionTarget({ id: r.id, status: "accepted", name: r.name })
                }
              >
                {t("endConnection")}
              </TableRowAction>
            );
          }
          if (r.status === "pending") {
            return (
              <TableRowAction
                onClick={() =>
                  setActionTarget({ id: r.id, status: "pending", name: r.name })
                }
              >
                {t("cancelInvitation")}
              </TableRowAction>
            );
          }
          return null;
        },
      },
    ],
    [t, tTypes],
  );

  const rows: ConnectionRow[] = useMemo(() => {
    const allRelationships = [...currentProviders, ...pendingRelationships];
    return allRelationships.map((rel) => {
      const name = rel.receiverLabel ?? rel.invitedEmail ?? "-";
      const email = rel.invitedEmail ?? "-";
      return {
        id: rel.id,
        userImageUrl: rel.receiverImageUrl,
        userInitials: initialsFromLabel(name !== "-" ? name : email),
        type: rel.relationshipType,
        status: rel.status as ConnectionStatus,
        name,
        email,
        since: rel.respondedAt
          ? new Date(rel.respondedAt).toLocaleDateString()
          : rel.requestedAt
            ? new Date(rel.requestedAt).toLocaleDateString()
            : "-",
      };
    });
  }, [currentProviders, pendingRelationships]);

  if (isPending) {
    return <HorseConnectionsTableSkeleton />;
  }

  if (hasError) {
    return (
      <p className="text-sm text-destructive">
        {t("tableLoadFailed")}
      </p>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        enableSorting
        enableFiltering
        emptyStateMessage={t("noResults")}
        dropdownOptionsByColumnKey={dropdownOptionsByColumnKey}
        isRealtimeFilterColumn={() => true}
        columnOrder={[...COLUMN_ORDER]}
        defaultColumnOrder={[...COLUMN_ORDER]}
      />

      <ConfirmDeleteDialog
        open={actionTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isActionPending) setActionTarget(null);
        }}
        title={
          actionTarget?.status === "accepted"
            ? t("endConnectionConfirmTitle")
            : t("cancelInvitationConfirmTitle")
        }
        description={
          actionTarget?.status === "accepted"
            ? t("endConnectionConfirmDescription", { name: actionTarget.name })
            : t("cancelInvitationConfirmDescription", {
                name: actionTarget?.name ?? "",
              })
        }
        confirmLabel={
          actionTarget?.status === "accepted" ? t("endConnection") : t("cancelInvitation")
        }
        cancelLabel={t("cancel")}
        isPending={isActionPending}
        onConfirm={handleConfirmAction}
      />
    </>
  );
}
