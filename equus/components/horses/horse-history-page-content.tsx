"use client";

import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { useHorseAuditLogs } from "@/hooks/queries/useHorseAudit.ts";

type Props = { horseId: string };

export function HorseHistoryPageContent({ horseId }: Props) {
  const t = useTranslations("horseHistory");
  const { data: logs = [] } = useHorseAuditLogs(horseId);

  type LogRow = {
    id: string;
    date: string;
    action: string;
    description: string;
    actor: string;
  };

  const columns: DataTableColumnDef<LogRow>[] = [
    { accessorKey: "date", header: t("date"), enableSorting: true },
    { accessorKey: "action", header: t("action"), enableSorting: true, filterType: "input" },
    { accessorKey: "description", header: t("description"), filterType: "input" },
    { accessorKey: "actor", header: t("actor"), enableSorting: true, filterType: "input" },
  ];

  const rows: LogRow[] = logs.map((log) => ({
    id: log.id,
    date: new Date(log.createdAt).toLocaleString(),
    action: t(`actions.${log.actionType.replace(/\./g, "_")}`),
    description: log.description,
    actor: log.actorLabel,
  }));

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      <DataTable
        columns={columns}
        data={rows}
        enableSorting
        enableFiltering
        emptyStateMessage={t("empty")}
      />
    </HorsePageShell>
  );
}
