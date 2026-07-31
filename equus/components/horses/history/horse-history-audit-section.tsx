/**
 * HorseHistoryAuditSection — audit log table for the History tab.
 *
 * Column order (fixed): user, username, userEmail, type, action, date.
 * Shares Admin History DataTable helpers / props.
 */

"use client";

import { useTranslations } from "next-intl";

import {
  DataTable,
  initialsFromLabel,
  TableUserAvatarCell,
  type DataTableColumnDef,
} from "@/components/table";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useHorseAuditLogs } from "@/hooks/queries/useHorseAudit.ts";
import { relationshipTypeEnums } from "@/utils/enums.ts";

type Props = { horseId: string };

type LogRow = {
  id: string;
  userImageUrl?: string;
  userInitials: string;
  userUsername: string;
  userEmail: string;
  type: string;
  action: string;
  date: string;
};

const COLUMN_ORDER = [
  "user",
  "userUsername",
  "userEmail",
  "type",
  "action",
  "date",
] as const;

const TEAM_SOURCE_TYPES = ["owner", "co_owner", "responsible", "system", "unknown"] as const;

export function HorseHistoryAuditSection({ horseId }: Props) {
  const t = useTranslations("horseHistory");
  const tProviderTypes = useTranslations("invites.horseProviders.types");
  const { data: logs = [], isPending, isError } = useHorseAuditLogs(horseId);

  function formatAction(actionType: string): string {
    const key = actionType.replace(/\./g, "_");
    if (t.has(`actions.${key}`)) {
      return t(`actions.${key}`);
    }
    return actionType.replace(/\./g, " · ");
  }

  function formatSourceType(sourceType: string): string {
    if (TEAM_SOURCE_TYPES.includes(sourceType as (typeof TEAM_SOURCE_TYPES)[number])) {
      return t(`types.${sourceType}`);
    }
    if (relationshipTypeEnums.includes(sourceType as (typeof relationshipTypeEnums)[number])) {
      return tProviderTypes(sourceType);
    }
    return t("types.unknown");
  }

  const columns: DataTableColumnDef<LogRow>[] = [
    {
      id: "user",
      accessorKey: "userInitials",
      header: t("user"),
      enableSorting: false,
      cell: ({ row }) => (
        <TableUserAvatarCell
          imageUrl={row.original.userImageUrl}
          initials={row.original.userInitials}
        />
      ),
    },
    {
      id: "userUsername",
      accessorKey: "userUsername",
      header: t("username"),
      enableSorting: true,
      filterType: "input",
    },
    {
      id: "userEmail",
      accessorKey: "userEmail",
      header: t("userEmail"),
      enableSorting: true,
      filterType: "input",
    },
    {
      id: "type",
      accessorKey: "type",
      header: t("type"),
      enableSorting: true,
      filterType: "input",
    },
    {
      id: "action",
      accessorKey: "action",
      header: t("action"),
      enableSorting: true,
      filterType: "input",
    },
    {
      id: "date",
      accessorKey: "date",
      header: t("date"),
      enableSorting: true,
      meta: { dataType: "date" },
    },
  ];

  if (isPending) {
    return <HorseHistoryAuditSkeleton />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">{t("loadFailed")}</p>;
  }

  const rows: LogRow[] = logs.map((log) => {
    const userEmail = log.userEmail?.trim() || "—";
    const userUsername = log.userUsername?.trim() || "—";
    return {
      id: log.id,
      userImageUrl: log.userImageUrl,
      userInitials: initialsFromLabel(userUsername !== "—" ? userUsername : userEmail),
      userUsername,
      userEmail,
      type: formatSourceType(log.sourceType),
      action: formatAction(log.actionType),
      date: new Date(log.createdAt).toLocaleString(),
    };
  });

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableSorting
      enableFiltering
      emptyStateMessage={t("empty")}
      isRealtimeFilterColumn={() => true}
      columnOrder={[...COLUMN_ORDER]}
      defaultColumnOrder={[...COLUMN_ORDER]}
    />
  );
}

function HorseHistoryAuditSkeleton() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}
