"use client";

import { useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type ColumnOrderState,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  type FilterFn,
} from "@tanstack/react-table";
import { toast } from "sonner";

import type { UseEnhancedTableConfig, UseEnhancedTableReturn } from "./types";
import { tableColumnFilterFn } from "./utils";

export function useEnhancedTable<TData = Record<string, unknown>>({
  data,
  columns,
  getRowId,
  pageSize = 150,
  columnOrder,
  columnVisibility,
  onColumnOrderChange,
  onColumnVisibilityChange,
  defaultColumnOrder = [],
  defaultColumnVisibility = {},
  onResetColumnState,
  enablePagination = true,
  enableSorting = true,
  enableFiltering = true,
}: UseEnhancedTableConfig<TData>): UseEnhancedTableReturn<TData> {
  const t = useTranslations("table");

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const dragActive = useRef(false);

  const handleSortingChange = useCallback(
    (updater: SortingState | ((prev: SortingState) => SortingState)) => {
      setSorting((prev) => (typeof updater === "function" ? updater(prev) : updater));
    },
    [],
  );

  const handleColumnFiltersChange = useCallback(
    (updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState)) => {
      setColumnFilters((prev) => (typeof updater === "function" ? updater(prev) : updater));
    },
    [],
  );

  const handleColumnOrderChange = useCallback(
    (updater: ColumnOrderState | ((prev: ColumnOrderState) => ColumnOrderState)) => {
      const next = typeof updater === "function" ? updater(columnOrder) : updater;
      onColumnOrderChange(next);
    },
    [columnOrder, onColumnOrderChange],
  );

  const handleColumnVisibilityChange = useCallback(
    (updater: VisibilityState | ((prev: VisibilityState) => VisibilityState)) => {
      const next = typeof updater === "function" ? updater(columnVisibility) : updater;
      onColumnVisibilityChange(next);
    },
    [columnVisibility, onColumnVisibilityChange],
  );

  const table = useReactTable<TData>({
    data,
    columns,
    defaultColumn: {
      filterFn: tableColumnFilterFn as FilterFn<TData>,
    },
    enableSorting,
    autoResetPageIndex: false,
    getRowId: (row, index) => {
      if (getRowId) return getRowId(row, index);
      return String(index);
    },
    onSortingChange: enableSorting ? handleSortingChange : undefined,
    onColumnFiltersChange: enableFiltering ? handleColumnFiltersChange : undefined,
    onColumnOrderChange: handleColumnOrderChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    getCoreRowModel: getCoreRowModel(),
    ...(enablePagination ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    ...(enableFiltering ? { getFilteredRowModel: getFilteredRowModel() } : {}),
    state: {
      sorting: enableSorting ? sorting : [],
      columnFilters: enableFiltering ? columnFilters : [],
      columnVisibility,
      columnOrder,
    },
    initialState: {
      pagination: { pageSize },
    },
  });

  const handleDragStart = useCallback(
    (e: React.DragEvent, columnId: string) => {
      dragActive.current = true;
      setDraggedColumn(columnId);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", columnId);
    },
    [],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumnId: string) => {
      e.preventDefault();
      if (!draggedColumn || draggedColumn === targetColumnId) {
        setDraggedColumn(null);
        return;
      }

      const currentOrder =
        columnOrder.length > 0
          ? columnOrder
          : table.getAllColumns().map((col) => col.id);

      const draggedIndex = currentOrder.indexOf(draggedColumn);
      const targetIndex = currentOrder.indexOf(targetColumnId);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedColumn(null);
        return;
      }

      const newOrder = [...currentOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedColumn);

      onColumnOrderChange(newOrder);
      setDraggedColumn(null);
    },
    [columnOrder, draggedColumn, onColumnOrderChange, table],
  );

  const handleDragEnd = useCallback(() => {
    dragActive.current = true;
    setDraggedColumn(null);
  }, []);

  const resetColumns = useCallback(() => {
    if (onResetColumnState) {
      onResetColumnState();
    } else {
      onColumnOrderChange(defaultColumnOrder.length > 0 ? defaultColumnOrder : []);
      onColumnVisibilityChange(defaultColumnVisibility);
    }
    toast.success(t("resetColumnsSuccess"), {
      duration: 2000,
      closeButton: false,
    });
  }, [
    defaultColumnOrder,
    defaultColumnVisibility,
    onColumnOrderChange,
    onColumnVisibilityChange,
    onResetColumnState,
    t,
  ]);

  return {
    table,
    draggedColumn,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    resetColumns,
    dragActive,
  };
}
