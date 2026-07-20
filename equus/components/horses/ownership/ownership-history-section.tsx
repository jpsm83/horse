"use client";

import { useTranslations } from "next-intl";

import { Skeleton } from "@/components/ui/skeleton.tsx";
import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { useHorseOwnershipHistory } from "@/hooks/queries/useHorse.ts";

type OwnershipHistorySectionProps = {
  horseId: string;
};

type HistoryRow = {
  id: string;
  date: string;
  type: string;
  from: string;
  to: string;
};

function getTypeLabel(transfer: Record<string, unknown>, t: (key: string) => string): string {
  switch (transfer.transferKind) {
    case "transfer_main":
      return t("kind.transfer_main");
    case "promote_co_owner":
      return t("kind.promote_co_owner");
    case "remove_co_owner":
      return t("kind.remove_co_owner");
    default:
      return String(transfer.transferKind ?? "");
  }
}

export function OwnershipHistorySection({ horseId }: OwnershipHistorySectionProps) {
  const t = useTranslations("horseSale");
  const { data: ownershipHistory = [], isPending } = useHorseOwnershipHistory(horseId);

  const columns: DataTableColumnDef<HistoryRow>[] = [
    { id: "date", accessorKey: "date", header: t("historyDate"), enableSorting: true },
    { id: "type", accessorKey: "type", header: t("historyType"), enableSorting: true, filterType: "input" },
    { id: "from", accessorKey: "from", header: t("historyFrom") },
    { id: "to", accessorKey: "to", header: t("historyTo") },
  ];

  const rows: HistoryRow[] = ownershipHistory.map((transfer: Record<string, unknown>) => ({
    id: String(transfer.id ?? transfer._id),
    date: transfer.respondedAt
      ? new Date(transfer.respondedAt as string).toLocaleDateString()
      : "-",
    type: getTypeLabel(transfer, t),
    from: String(transfer.initiatorLabel ?? "-"),
    to: String(transfer.receiverLabel ?? transfer.targetCoOwnerLabel ?? "-"),
  }));

  if (isPending) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableSorting
      enableFiltering
      emptyStateMessage={t("noHistory")}
    />
  );
}
