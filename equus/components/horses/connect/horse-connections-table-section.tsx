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
  TableIconAction,
  TableUserAvatarCell,
  type DataTableColumnDef,
} from "@/components/table";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useHorseProviders, useHorsePendingRelationships } from "@/hooks/queries/useHorse.ts";
import { useEndRelationship, useCancelSentInvite, useCreateRelationshipInvite } from "@/hooks/queries/useRelationship.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { relationshipTypeEnums } from "@/utils/enums";
import { relationshipTypeFilterOptions, relationshipStatusFilterOptions } from "@/utils/filter-options";
import { Ban, Send } from "lucide-react";

type Props = { horseId: string };

type ConnectionStatus = "accepted" | "pending" | "declined" | "ended";

type ConnectionRow = {
  id: string;
  userImageUrl?: string;
  userInitials: string;
  type: string;
  status: ConnectionStatus;
  name: string;
  email: string;
  since: string;
  receiverAccountId?: string;
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
    data: endedProviders = [],
    isPending: isEndedPending,
    isError: isEndedError,
  } = useHorseProviders(horseId, "ended");
  const {
    data: pendingRelationships = [],
    isPending: isRelationshipsPending,
    isError: isRelationshipsError,
  } = useHorsePendingRelationships(horseId);
  const endMutation = useEndRelationship();
  const cancelMutation = useCancelSentInvite();
  const resendMutation = useCreateRelationshipInvite();
  const [actionTarget, setActionTarget] = useState<ActionTarget | null>(null);

  const isPending = isProvidersPending || isEndedPending || isRelationshipsPending;
  const isActionPending = endMutation.isPending || cancelMutation.isPending || resendMutation.isPending;
  const hasError = isProvidersError || isEndedError || isRelationshipsError;

  function formatStatus(status: ConnectionStatus): string {
    switch (status) {
      case "accepted":
        return t("statusActive");
      case "pending":
        return t("statusPending");
      case "declined":
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

  function handleResendInvite(row: ConnectionRow) {
    resendMutation.mutate(
      {
        horseId,
        relationshipType: row.type as Parameters<typeof resendMutation.mutate>[0]["relationshipType"],
        receiverAccountId: row.receiverAccountId,
        invitedEmail: row.email !== "-" ? row.email : undefined,
        invitedName: row.name !== "-" ? row.name : undefined,
      },
      {
        onSuccess: () => toast.success(t("invitationResent")),
        onError: () => toast.error(t("invitationResendFailed")),
      },
    );
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
              <div className="flex justify-center">
                <TableIconAction
                  onClick={() =>
                    setActionTarget({ id: r.id, status: "accepted", name: r.name })
                  }
                  title={t("endConnection")}
                  aria-label={t("endConnection")}
                >
                  <Ban className="h-4 w-4 text-destructive" />
                </TableIconAction>
              </div>
            );
          }
          if (r.status === "pending") {
            return (
              <div className="flex justify-center gap-1">
                <TableIconAction
                  onClick={() =>
                    setActionTarget({ id: r.id, status: "pending", name: r.name })
                  }
                  title={t("cancelInvitation")}
                  aria-label={t("cancelInvitation")}
                >
                  <Ban className="h-4 w-4 text-destructive" />
                </TableIconAction>
                <TableIconAction
                  onClick={() => handleResendInvite(r)}
                  title={t("resendInvitation")}
                  aria-label={t("resendInvitation")}
                >
                  <Send className="h-4 w-4" />
                </TableIconAction>
              </div>
            );
          }
          return null;
        },
      },
    ],
    [t, tTypes],
  );

  const rows: ConnectionRow[] = useMemo(() => {
    const allRelationships = [...currentProviders, ...endedProviders, ...pendingRelationships];
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
        receiverAccountId: rel.receiverAccountId,
        since: rel.endedAt
          ? new Date(rel.endedAt).toLocaleDateString()
          : rel.respondedAt
            ? new Date(rel.respondedAt).toLocaleDateString()
            : rel.requestedAt
              ? new Date(rel.requestedAt).toLocaleDateString()
              : "-",
      };
    });
  }, [currentProviders, endedProviders, pendingRelationships]);

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

function HorseConnectionsTableSkeleton() {
  return (
    <div className="relative w-full h-full">
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <Spinner className="size-6" />
        </div>
      <Skeleton className="inset-0 h-full w-full p-4 rounded-md" />
    </div>
  );
}
