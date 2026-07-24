/**
 * HorseHistoryAuditSection — audit log table for the History tab.
 *
 * Column order (fixed): user, username, userEmail, type, action, date.
 */

"use client";

import { useTranslations } from "next-intl";

import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton.tsx";
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

function initialsFromLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed || trimmed === "—") return "?";
  const parts = trimmed.split(/[\s@._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function HorseHistoryAuditSection({ horseId }: Props) {
  const t = useTranslations("horseHistory");
  const tProviderTypes = useTranslations("invites.horseProviders.types");
  const { data: logs = [], isPending } = useHorseAuditLogs(horseId);

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
      cell: ({ row }) => {
        const { userImageUrl, userInitials } = row.original;
        return (
          <div className="flex w-full items-center justify-center">
            <Avatar size="sm" className="rounded-full">
              {userImageUrl ? (
                <AvatarImage src={userImageUrl} alt="" className="object-cover" />
              ) : null}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </div>
        );
      },
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
    return <Skeleton className="h-[400px] w-full rounded-lg" />;
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
      columnOrder={[...COLUMN_ORDER]}
      defaultColumnOrder={[...COLUMN_ORDER]}
    />
  );
}
