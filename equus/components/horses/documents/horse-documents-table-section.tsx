"use client";

/**
 * HorseDocumentsTableSection — Documents tab table (Admin History DataTable pattern).
 */

import { useMemo, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Download, Trash2 } from "lucide-react";

import {
  DataTable,
  initialsFromLabel,
  TableIconAction,
  TableUserAvatarCell,
  type DataTableColumnDef,
} from "@/components/table";
import { ConfirmDeleteDialog } from "@/components/shared/confirm-delete-dialog.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";
import { useHorseDocuments, useDeleteHorseDocument } from "@/hooks/queries/useHorseDocuments.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import type { PublicHorseDocument } from "@/lib/services/horseDocumentService";
import { documentTypeEnums } from "@/utils/enums";

type Props = { horseId: string };

type DocumentRow = PublicHorseDocument & {
  userInitials: string;
};

const COLUMN_ORDER = [
  "user",
  "date",
  "type",
  "format",
  "title",
  "description",
  "uploadedByName",
  "action",
] as const;

const documentTypeFilterOptions = documentTypeEnums.map((dt) => ({
  value: dt,
  label: dt.charAt(0).toUpperCase() + dt.slice(1),
}));

export function HorseDocumentsTableSection({ horseId }: Props) {
  const t = useTranslations("horseDocuments");
  const tCommon = useTranslations("common");
  const tTypes = useTranslations("horseDocuments.types");
  const toast = useAppToast();
  const { data: docs = [], isPending, isError } = useHorseDocuments(horseId);
  const deleteMutation = useDeleteHorseDocument(horseId);
  const [deleteTarget, setDeleteTarget] = useState<PublicHorseDocument | null>(null);

  const handleDownload = useCallback(
    async (doc: PublicHorseDocument) => {
      try {
        const response = await fetchWithAuth(
          `/api/v1/horses/${encodeURIComponent(horseId)}/documents/${encodeURIComponent(doc.id)}/download`,
        );
        if (!response.ok) throw new Error("Download failed");
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        // Programmatic download requires an imperatively-clicked anchor — no
        // declarative React equivalent forces a browser save without navigation.
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        toast.error(t("downloadError"));
      }
    },
    [horseId, toast, t],
  );

  function handleConfirmDelete() {
    if (!deleteTarget) return;

    deleteMutation.mutate(
      { docId: deleteTarget.id },
      {
        onSuccess: () => {
          toast.success(t("deleteSuccess"));
          setDeleteTarget(null);
        },
        onError: () => toast.error(t("deleteError")),
      },
    );
  }

  const dropdownOptionsByColumnKey = useMemo(
    () => ({
      type: documentTypeFilterOptions,
    }),
    [],
  );

  const rows: DocumentRow[] = useMemo(
    () =>
      docs.map((doc) => ({
        ...doc,
        userInitials: initialsFromLabel(doc.uploadedByName),
      })),
    [docs],
  );

  const columns: DataTableColumnDef<DocumentRow>[] = useMemo(
    () => [
      {
        id: "user",
        accessorKey: "userInitials",
        header: t("user"),
        enableSorting: false,
        cell: ({ row }) => (
          <TableUserAvatarCell
            imageUrl={row.original.uploadedByImageUrl}
            initials={row.original.userInitials}
          />
        ),
      },
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
        accessorFn: (r) => r.documentType,
        header: t("type"),
        enableSorting: true,
        filterType: "dropdown",
        cell: ({ row }) => tTypes(row.original.documentType),
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
        id: "action",
        header: t("actions"),
        enableSorting: false,
        cell: ({ row }) => {
          const doc = row.original;
          return (
            <div className="flex justify-center gap-1">
              <TableIconAction
                onClick={() => handleDownload(doc)}
                title={t("download")}
                aria-label={t("download")}
              >
                <Download className="h-4 w-4" />
              </TableIconAction>
              <TableIconAction
                onClick={() => setDeleteTarget(doc)}
                title={t("delete")}
                aria-label={t("delete")}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </TableIconAction>
            </div>
          );
        },
      },
    ],
    [t, tTypes, handleDownload],
  );

  if (isPending) {
    return <HorseDocumentsTableSkeleton />;
  }

  if (isError) {
    return <p className="text-sm text-destructive">{t("docsLoadFailed")}</p>;
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={rows}
        enableSorting
        enableFiltering
        emptyStateMessage={t("noDocuments")}
        dropdownOptionsByColumnKey={dropdownOptionsByColumnKey}
        isRealtimeFilterColumn={() => true}
        columnOrder={[...COLUMN_ORDER]}
        defaultColumnOrder={[...COLUMN_ORDER]}
      />

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("deleteConfirm")}
        description={t("deleteConfirmDescription")}
        confirmLabel={t("delete")}
        cancelLabel={tCommon("cancel")}
        isPending={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

function HorseDocumentsTableSkeleton() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Spinner className="size-6" />
      </div>
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}
