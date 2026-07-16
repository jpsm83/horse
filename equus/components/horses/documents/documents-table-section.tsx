"use client";

import { useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Download, Trash2 } from "lucide-react";

import { DataTable } from "@/components/table";
import type { DataTableColumnDef } from "@/components/table";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { useHorseDocuments, useDeleteHorseDocument } from "@/hooks/queries/useHorseDocuments.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { PublicHorseDocument } from "@/lib/services/horseDocumentService";
import { documentTypeEnums } from "@/utils/enums";

type Props = { horseId: string };

const documentTypeFilterOptions = documentTypeEnums.map((dt) => ({
  value: dt,
  label: dt.charAt(0).toUpperCase() + dt.slice(1),
}));

export function DocumentsTableSection({ horseId }: Props) {
  const t = useTranslations("horseDocuments");
  const tTypes = useTranslations("horseDocuments.types");
  const toast = useAppToast();
  const { data: docs = [], isPending } = useHorseDocuments(horseId);
  const deleteMutation = useDeleteHorseDocument(horseId);

  const handleDelete = useCallback((docId: string) => {
    deleteMutation.mutate(docId, {
      onSuccess: () => toast.success(t("deleteSuccess")),
      onError: () => toast.error(t("deleteError")),
    });
  }, [deleteMutation, toast, t]);

  const dropdownOptionsByColumnKey = useMemo(() => ({
    type: documentTypeFilterOptions,
  }), []);

  const columns: DataTableColumnDef<PublicHorseDocument>[] = useMemo(() => [
    {
      id: "date",
      accessorFn: (r) => new Date(r.createdAt).toLocaleDateString(),
      header: t("date"),
      enableSorting: true,
      filterType: "input",
      meta: { dataType: "date" },
    },
    {
      id: "type",
      accessorFn: (r) => tTypes(r.documentType),
      header: t("type"),
      enableSorting: true,
      filterType: "dropdown",
    },
    {
      id: "format",
      accessorFn: (r) => {
        const ext = r.fileName?.split(".").pop();
        return ext ? ext.toUpperCase() : "-";
      },
      header: t("format"),
      enableSorting: true,
      filterType: "input",
    },
    {
      id: "title",
      accessorKey: "title",
      header: t("title"),
      enableSorting: true,
      filterType: "input",
    },
    {
      id: "description",
      accessorFn: (r) => r.description ?? "-",
      header: t("description"),
      enableSorting: true,
      filterType: "input",
      cell: ({ row }) => {
        const text = row.original.description;
        if (!text) return <span className="text-muted-foreground">-</span>;
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="block max-w-[200px] truncate cursor-help text-left">
                {text}
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm break-words">
                {text}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: "uploadedByName",
      accessorKey: "uploadedByName",
      header: t("uploadedBy"),
      enableSorting: true,
      filterType: "input",
    },
    {
      id: "actions",
      header: t("actions"),
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(doc.fileUrl, "_blank")}
              title={t("download")}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(doc.id)}
              title={t("delete")}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ], [t, tTypes, handleDelete]);

  if (isPending) {
    return <Skeleton className="h-full w-full rounded-lg" />;
  }

  return (
    <DataTable
      columns={columns}
      data={docs}
      enableSorting
      enableFiltering
      emptyStateMessage={t("noDocuments")}
      dropdownOptionsByColumnKey={dropdownOptionsByColumnKey}
    />
  );
}
