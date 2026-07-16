"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { type Column } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  X,
  Loader2,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { GenericTablePaginationProps } from "./types";

const PAGE_SIZES = [10, 20, 30, 50];

export function PaginationBar<TData = Record<string, unknown>>({
  table,
  onClearFilters,
  onResetColumns,
  onExport,
  enabledColumnIds,
}: GenericTablePaginationProps<TData>) {
  const t = useTranslations("table");

  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const hideableColumns = useMemo(() => {
    const all = table
      .getAllColumns()
      .filter((column: Column<TData, unknown>) => column.getCanHide());
    if (enabledColumnIds?.length) {
      return all.filter((col) => enabledColumnIds.includes(col.id));
    }
    return all;
  }, [table, enabledColumnIds]);

  const handleColumnToggle = useCallback(
    (columnId: string, checked: boolean) => {
      const column = table.getColumn(columnId);
      if (column) column.toggleVisibility(checked);
    },
    [table],
  );

  const handleExport = useCallback(async () => {
    if (!onExport || isExporting) return;
    if (isMountedRef.current) setIsExporting(true);
    try {
      await onExport();
      toast.success(t("pagination.exportSuccess"), {
        duration: 3000,
        closeButton: false,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error(t("pagination.exportError"), {
        duration: 3000,
        closeButton: false,
      });
    } finally {
      if (isMountedRef.current) setIsExporting(false);
    }
  }, [onExport, isExporting, t]);

  const hasFilteredRows = table.getFilteredRowModel().rows.length > 0;

  return (
    <div className="flex items-center justify-between pt-4 shrink-0">
      <div className="text-sm text-muted-foreground cursor-default">
        {t("pagination.rowCount", {
          count: table.getFilteredRowModel().rows.length,
        })}
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-sm font-medium">
          {t("pagination.page")}{" "}
          {table.getState().pagination.pageIndex + 1} {t("pagination.of")}{" "}
          {table.getPageCount()}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t("pagination.goToFirstPage")}</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t("pagination.goToPreviousPage")}</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t("pagination.goToNextPage")}</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t("pagination.goToLastPage")}</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">{t("pagination.rowsPerPage")}</p>
          <DropdownMenu>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              {table.getState().pagination.pageSize}
              <ChevronDown />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {PAGE_SIZES.map((pageSize) => (
                <DropdownMenuItem
                  key={pageSize}
                  onClick={() => table.setPageSize(pageSize)}
                  className={table.getState().pagination.pageSize === pageSize ? "font-medium text-primary" : ""}
                >
                  {pageSize}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters}>
            <X />
            {t("pagination.clearFilters")}
          </Button>
        )}

        <DropdownMenu
          open={isColumnDropdownOpen}
          onOpenChange={setIsColumnDropdownOpen}
        >
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            {t("pagination.columns")}
            <ChevronDown />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 max-h-80" align="start">
            {onResetColumns && (
              <>
                <DropdownMenuItem
                  onClick={onResetColumns}
                  className="font-medium text-primary"
                >
                  {t("pagination.resetOrderVisibility")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {hideableColumns.map((column: Column<TData, unknown>) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={column.getIsVisible()}
                onCheckedChange={(checked) =>
                  handleColumnToggle(column.id, checked)
                }
                className="capitalize"
              >
                {(column.columnDef.meta as { label?: string })?.label || column.id}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting || !onExport || !hasFilteredRows}
        >
          {isExporting ? <Loader2 className="animate-spin" /> : <Download />}
          {isExporting
            ? t("pagination.exporting")
            : t("pagination.exportFilteredData")}
        </Button>
      </div>
    </div>
  );
}
