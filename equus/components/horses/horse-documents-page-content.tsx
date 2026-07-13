"use client";

import { useTranslations } from "next-intl";
import { HorsePageShell } from "@/components/horses/horse-page-shell.tsx";
import { DataTable, type ColumnDef } from "@/components/ui/data-table.tsx";
import { SectionVisibilityPopover } from "@/components/ui/section-visibility-popover.tsx";
import { useHorseDocuments } from "@/hooks/queries/useHorseDocuments.ts";

type Props = { horseId: string };

export function HorseDocumentsPageContent({ horseId }: Props) {
  const t = useTranslations("horseDocuments");
  const { data: docs = [] } = useHorseDocuments(horseId);

  const columns: ColumnDef<typeof docs[0]>[] = [
    {
      id: "type",
      header: t("type"),
      accessorFn: (r) => t(`types.${r.documentType}`),
      sortable: true,
      filterable: true,
    },
    {
      id: "title",
      header: t("title"),
      accessorFn: (r) => r.title,
      sortable: true,
      filterable: true,
    },
    {
      id: "date",
      header: t("date"),
      accessorFn: (r) => new Date(r.createdAt).toLocaleDateString(),
      sortable: true,
    },
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
        filterPlaceholder={t("filterPlaceholder")}
        emptyMessage={t("noDocuments")}
      />
    </HorsePageShell>
  );
}
