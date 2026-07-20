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
import { ResponsibleList } from "@/components/horses/ownership/responsible-list.tsx";
import { InviteResponsibleForm } from "@/components/horses/ownership/invite-responsible-form.tsx";
import { useOwnerHorse, useHorseOwnershipTransfers, useHorseOwnershipHistory } from "@/hooks/queries/useHorse.ts";
import { useCreateOwnershipTransfer } from "@/hooks/queries/useOwnershipTransfer.ts";
import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
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
  const createTransfer = useCreateOwnershipTransfer();

  type HistoryRow = {
    id: string;
    date: string;
    type: string;
    from: string;
    to: string;
  };

  const historyColumns: DataTableColumnDef<HistoryRow>[] = [
    { id: "date", accessorKey: "date", header: tSale("historyDate"), enableSorting: true },
    { id: "type", accessorKey: "type", header: tSale("historyType"), enableSorting: true, filterType: "input" },
    { id: "from", accessorKey: "from", header: tSale("historyFrom") },
    { id: "to", accessorKey: "to", header: tSale("historyTo") },
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
    <HorsePageShell horseId={horseId} requireOwnership requireMainOwner>
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

          {isOwner && (
            <>
              <section className="space-y-4">
                <h2 className="text-xl font-semibold">Responsible Persons</h2>
                <ResponsibleList
                  responsibles={horse.responsibles}
                  isMainOwner={isOwner}
                  onRemove={(userId) =>
                    createTransfer.mutate({
                      entityType: "horse",
                      entityId: horseId,
                      transferKind: "remove_responsible",
                      targetCoOwnerUserId: userId,
                    })
                  }
                />
                <InviteResponsibleForm
                  horseId={horseId}
                  isPending={createTransfer.isPending}
                  onSubmit={(email) =>
                    createTransfer.mutate({
                      entityType: "horse",
                      entityId: horseId,
                      transferKind: "add_responsible",
                      invitedEmail: email,
                    })
                  }
                />
              </section>
              <hr className="my-6" />
            </>
          )}

          <section className="space-y-4">
            <h2 className="text-xl font-semibold">{tSale("ownershipHistory")}</h2>
            <DataTable
              columns={historyColumns}
              data={historyRows}
              enableSorting
              enableFiltering
              emptyStateMessage={tSale("noHistory")}
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
