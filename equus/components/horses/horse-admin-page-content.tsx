/**
 * HorseAdminPageContent — renamed from Sale. Contains sale settings,
 * ownership management (moved from Hub), ownership history, and Hub toggle.
 */

"use client";

import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";

import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { HorseSaleForm } from "@/components/horses/horse-sale-form.tsx";
import { HorseOwnershipHub } from "@/components/horses/horse-ownership-hub.tsx";
import { useOwnerHorse, useHorseOwnershipTransfers, useHorseOwnershipHistory } from "@/hooks/queries/useHorse.ts";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { queryKeys } from "@/lib/api/queryKeys";

type HorseAdminPageContentProps = {
  horseId: string;
};

export function HorseAdminPageContent({ horseId }: HorseAdminPageContentProps) {
  const t = useTranslations("horseAdmin");
  const tSale = useTranslations("horseSale");
  const queryClient = useQueryClient();
  const { data: horse } = useOwnerHorse(horseId);
  const { data: ownershipTransfers = [] } = useHorseOwnershipTransfers(
    horse?.isMainOwner ? horseId : undefined,
  );
  const { data: ownershipHistory = [] } = useHorseOwnershipHistory(horseId);

  type HistoryRow = {
    id: string;
    date: string;
    type: string;
    from: string;
    to: string;
  };

  const historyColumns: ColumnDef<HistoryRow>[] = [
    {
      id: "date",
      header: tSale("historyDate"),
      accessorFn: (row) => row.date,
      sortable: true,
    },
    {
      id: "type",
      header: tSale("historyType"),
      accessorFn: (row) => row.type,
      sortable: true,
      filterable: true,
    },
    {
      id: "from",
      header: tSale("historyFrom"),
      accessorFn: (row) => row.from,
    },
    {
      id: "to",
      header: tSale("historyTo"),
      accessorFn: (row) => row.to,
    },
  ];

  const historyRows: HistoryRow[] = ownershipHistory.map((transfer: Record<string, unknown>) => {
    let typeLabel = String(transfer.transferKind ?? "");
    if (transfer.transferKind === "transfer_main") typeLabel = tSale("kind.transfer_main");
    else if (transfer.transferKind === "promote_co_owner") typeLabel = tSale("kind.promote_co_owner");
    else if (transfer.transferKind === "remove_co_owner") typeLabel = tSale("kind.remove_co_owner");

    return {
      id: String(transfer.id ?? transfer._id),
      date: transfer.respondedAt
        ? new Date(transfer.respondedAt as string).toLocaleDateString()
        : "-",
      type: typeLabel,
      from: String(transfer.initiatorLabel ?? "-"),
      to: String(transfer.receiverLabel ?? transfer.targetCoOwnerLabel ?? "-"),
    };
  });

  return (
    <HorsePageShell horseId={horseId} title={t("pageTitle")} requireOwnership>
      {({ horse, isOwner }) => (
        <>
          <HorseSaleForm
            horseId={horseId}
            horse={horse}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: queryKeys.horses.owner(horseId) });
            }}
          />

          <hr className="my-6" />

          {isOwner && (
            <>
              <HorseOwnershipHub
                horseId={horseId}
                horse={horse}
                pendingTransfers={ownershipTransfers}
              />
              <hr className="my-6" />
            </>
          )}

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{tSale("ownershipHistory")}</h2>
            <DataTable
              columns={historyColumns}
              data={historyRows}
              filterPlaceholder={tSale("historyType")}
              emptyMessage={tSale("noHistory")}
            />
          </section>

          <hr className="my-6" />

          <section className="space-y-4 rounded-lg border p-4">
            <div>
              <h2 className="text-xl font-semibold">{t("hubToggleTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("hubToggleDescription")}</p>
            </div>
            <p className="text-sm text-muted-foreground">{t("hubToggleComingSoon")}</p>
          </section>
        </>
      )}
    </HorsePageShell>
  );
}
