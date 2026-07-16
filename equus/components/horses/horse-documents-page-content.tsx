"use client";

import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { SectionVisibilityPopover } from "@/components/shared/section-visibility-popover.tsx";
import { useHorseDocuments } from "@/hooks/queries/useHorseDocuments.ts";

type Props = { horseId: string };

export function HorseDocumentsPageContent({ horseId }: Props) {
  const t = useTranslations("horseDocuments");
  const { data: docs = [] } = useHorseDocuments(horseId);

  const columns: DataTableColumnDef<typeof docs[0]>[] = [
    { id: "type", accessorFn: (r) => t(`types.${r.documentType}`), header: t("type"), enableSorting: true, filterType: "input" },
    { id: "title", accessorKey: "title", header: t("title"), enableSorting: true, filterType: "input" },
    { id: "date", accessorFn: (r) => new Date(r.createdAt).toLocaleDateString(), header: t("date"), enableSorting: true },
  ];

  return (
    <HorsePageShell horseId={horseId} title={t("title")}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{t("description")}</p>
        <SectionVisibilityPopover
          sectionKey="documents"
          current={{ mode: "owner" }}
          onChange={() => {}}
        />
      </div>

      <DataTable
        columns={columns}
        data={docs}
        enableSorting
        enableFiltering
        emptyStateMessage={t("noDocuments")}
      />
    </HorsePageShell>
  );
}
