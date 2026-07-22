"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog.tsx";
import { Button } from "@/components/ui/button";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/queryKeys";

type AdminHistorySectionProps = {
  horseId: string;
};

type MemberType = "owner" | "co_owner" | "responsible";

type AdminRow = {
  id: string;
  userId: string;
  memberType: MemberType;
  type: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
};

type RemoveTarget = {
  userId: string;
  memberType: "co_owner" | "responsible";
  name: string;
};

const typeFilterOptions = [
  { value: "Owner", label: "Owner" },
  { value: "Co-owner", label: "Co-owner" },
  { value: "Proactive Representative", label: "Proactive Representative" },
];

export function AdminHistorySection({ horseId }: AdminHistorySectionProps) {
  const t = useTranslations("horseAdmin");
  const toast = useAppToast();
  const queryClient = useQueryClient();
  const { data: horse } = useOwnerHorse(horseId);
  const createTransfer = useCreateOwnershipTransfer();
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);

  const isMainOwner = horse?.isMainOwner === true;

  const rows: AdminRow[] = useMemo(() => {
    if (!horse) return [];
    return horse.adminTeam.map((member) => ({
      id: member.userId,
      userId: member.userId,
      memberType: member.type,
      type: t(`adminTypes.${member.type}`),
      name: member.name,
      email: member.email,
      phone: member.phone ?? "-",
      joinedAt: member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : "-",
    }));
  }, [horse?.adminTeam, t]);

  const dropdownOptionsByColumnKey = useMemo(
    () => ({
      type: typeFilterOptions,
    }),
    [],
  );

  function handleConfirmRemove() {
    if (!removeTarget) return;

    const transferKind =
      removeTarget.memberType === "co_owner" ? "remove_co_owner" : "remove_responsible";
    const successKey =
      removeTarget.memberType === "co_owner" ? "coOwnerRemoved" : "proactiveRemoved";

    createTransfer.mutate(
      {
        entityType: "horse",
        entityId: horseId,
        transferKind,
        targetCoOwnerUserId: removeTarget.userId,
      },
      {
        onSuccess: () => {
          toast.success(t(successKey));
          setRemoveTarget(null);
          void queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
          void queryClient.invalidateQueries({
            queryKey: queryKeys.horses.ownershipTransfers(horseId),
          });
        },
        onError: () => toast.error(t("removeFailed")),
      },
    );
  }

  const columns: DataTableColumnDef<AdminRow>[] = useMemo(
    () => [
      {
        id: "type",
        accessorKey: "type",
        header: t("adminHistoryType"),
        enableSorting: true,
        filterType: "dropdown",
      },
      {
        id: "name",
        accessorKey: "name",
        header: t("adminHistoryName"),
        enableSorting: true,
        filterType: "input",
      },
      {
        id: "email",
        accessorKey: "email",
        header: t("adminHistoryEmail"),
        filterType: "input",
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: t("adminHistoryPhone"),
        filterType: "input",
      },
      {
        id: "joinedAt",
        accessorKey: "joinedAt",
        header: t("adminHistoryJoined"),
        enableSorting: true,
        filterType: "input",
        meta: { dataType: "date" },
      },
      {
        id: "action",
        header: t("adminHistoryAction"),
        enableSorting: false,
        cell: ({ row }) => {
          const member = row.original;
          if (!isMainOwner) return null;
          if (member.memberType !== "co_owner" && member.memberType !== "responsible") {
            return null;
          }

          return (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              title={t("adminHistoryRemove")}
              aria-label={t("adminHistoryRemove")}
              onClick={() =>
                setRemoveTarget({
                  userId: member.userId,
                  memberType: member.memberType,
                  name: member.name,
                })
              }
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          );
        },
      },
    ],
    [t, isMainOwner],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        enableSorting
        enableFiltering
        emptyStateMessage={t("adminHistoryEmpty")}
        dropdownOptionsByColumnKey={dropdownOptionsByColumnKey}
        isRealtimeFilterColumn={() => true}
      />

      <ConfirmDeleteDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title={t("adminHistoryRemoveConfirmTitle")}
        description={
          removeTarget?.memberType === "co_owner"
            ? t("adminHistoryRemoveCoOwnerDescription", { name: removeTarget.name })
            : t("adminHistoryRemoveResponsibleDescription", {
                name: removeTarget?.name ?? "",
              })
        }
        confirmLabel={t("remove")}
        cancelLabel={t("cancel")}
        isPending={createTransfer.isPending}
        onConfirm={handleConfirmRemove}
      />
    </>
  );
}
