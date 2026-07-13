"use client";

import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
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

  const columns: ColumnDef<LogRow>[] = [
    { id: "date", header: t("date"), accessorFn: (r) => r.date, sortable: true },
    { id: "action", header: t("action"), accessorFn: (r) => r.action, sortable: true, filterable: true },
    { id: "description", header: t("description"), accessorFn: (r) => r.description, filterable: true },
    { id: "actor", header: t("actor"), accessorFn: (r) => r.actor, sortable: true, filterable: true },
  ];

  const rows: LogRow[] = logs.map((log) => ({
    id: log.id,
    date: new Date(log.createdAt).toLocaleString(),
    action: t(`actions.${log.actionType}` as any),
    description: log.description,
    actor: log.actorLabel,
  }));

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      <DataTable
        columns={columns}
        data={rows}
        filterPlaceholder={t("filterPlaceholder")}
        emptyMessage={t("empty")}
      />
    </HorsePageShell>
  );
}
