"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerHorse } from "@/hooks/queries/useHorse.ts";

type AdminHistorySectionProps = {
  horseId: string;
};

type AdminRow = {
  id: string;
  type: string;
  name: string;
  email: string;
  phone: string;
  joinedAt: string;
};

export function AdminHistorySection({ horseId }: AdminHistorySectionProps) {
  const t = useTranslations("horseAdmin");
  const { data: horse, isPending } = useOwnerHorse(horseId);

  const rows: AdminRow[] = useMemo(() => {
    if (!horse?.adminTeam) return [];
    return horse.adminTeam.map((member) => ({
      id: member.userId,
      type: t(`adminTypes.${member.type}`),
      name: member.name,
      email: member.email,
      phone: member.phone ?? "-",
      joinedAt: member.joinedAt
        ? new Date(member.joinedAt).toLocaleDateString()
        : "-",
    }));
  }, [horse?.adminTeam, t]);

  const columns: DataTableColumnDef<AdminRow>[] = useMemo(() => [
    { id: "type", accessorKey: "type", header: t("adminHistoryType"), enableSorting: true, filterType: "dropdown" },
    { id: "name", accessorKey: "name", header: t("adminHistoryName"), enableSorting: true },
    { id: "email", accessorKey: "email", header: t("adminHistoryEmail"), enableSorting: true },
    { id: "phone", accessorKey: "phone", header: t("adminHistoryPhone") },
    { id: "joinedAt", accessorKey: "joinedAt", header: t("adminHistoryJoined"), enableSorting: true },
  ], [t]);

  if (isPending) {
    return <Skeleton className="h-48 w-full rounded-lg" />;
  }

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableSorting
      enableFiltering
      emptyStateMessage={t("adminHistoryEmpty")}
    />
  );
}
