"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { flexRender } from "@tanstack/react-table";
import { GripVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type { DataTableColumnDef, DataTableProps } from "./types";
import { useEnhancedTable } from "./use-table";
import { useTableFilters, FilterRow } from "./filter";
import { PaginationBar } from "./pagination";
import {
  exportToExcel,
  buildDropdownOptionsByColumnKey,
  getVisibleTableColumns,
  tableBodyCellClassName,
  tableBodySurfaceClassName,
  tableBodySurfaceEmptyClassName,
  tableDataRowClassName,
  tableEmptyStateCellClassName,
  tableEmptyStateContentClassName,
  tableEmptyStateRowClassName,
} from "./utils";

function getColumnId<TData>(col: DataTableColumnDef<TData>): string {
  return (col as Record<string, unknown>).accessorKey as string ?? col.id ?? "";
}

export function DataTable<TData extends Record<string, unknown>>({
  data,
  columns,
  getRowId,
  pageSize = 10,
  enableSorting = true,
  enableFiltering = true,
  enablePagination = true,
  enableColumnReorder = true,
  enableExport = false,
  emptyStateMessage,
  emptyStateSubMessage,
  onRowClick,
  selectedRowId,
  highlightedRowId,
  columnOrder: externalColumnOrder,
  columnVisibility: externalColumnVisibility,
  onColumnOrderChange: externalOnColumnOrderChange,
  onColumnVisibilityChange: externalOnColumnVisibilityChange,
  defaultColumnOrder,
  defaultColumnVisibility,
  onResetColumnState,
  exportFileName = "export",
  exportSheetName = "Data",
  filterColumns = [],
  dropdownOptionsByColumnKey: externalDropdownOptions,
  isRealtimeFilterColumn,
  showFilterRow = true,
  className,
}: DataTableProps<TData>) {
  const tableRef = useRef<HTMLDivElement>(null);

  const derivedFilterColumns = useMemo(() => {
    if (filterColumns && filterColumns.length > 0) return filterColumns;
    return columns
      .filter((col) => col.filterType)
      .map((col) => ({
        columnKey: getColumnId(col),
        columnName: typeof col.header === "string" ? col.header : undefined,
        filter: col.filterType,
        config: col.filterConfig,
      }));
  }, [columns, filterColumns]);

  const [colOrder, setColOrder] = useState<string[]>(() =>
    externalColumnOrder ?? columns.map((col) => getColumnId(col)).filter(Boolean),
  );
  const [colVisibility, setColVisibility] = useState<Record<string, boolean>>(() => {
    if (externalColumnVisibility) return externalColumnVisibility;
    const vis: Record<string, boolean> = {};
    columns.forEach((col) => {
      const cid = getColumnId(col);
      if (cid) vis[cid] = true;
    });
    return vis;
  });

  const isControlled = externalColumnOrder !== undefined && externalColumnVisibility !== undefined;

  const currentColumnOrder = isControlled ? externalColumnOrder! : colOrder;
  const currentColumnVisibility = isControlled ? externalColumnVisibility! : colVisibility;

  const handleColumnOrderChange = useCallback(
    (order: string[]) => {
      if (externalOnColumnOrderChange) {
        externalOnColumnOrderChange(order);
      } else {
        setColOrder(order);
      }
    },
    [externalOnColumnOrderChange],
  );

  const handleColumnVisibilityChange = useCallback(
    (visibility: Record<string, boolean>) => {
      if (externalOnColumnVisibilityChange) {
        externalOnColumnVisibilityChange(visibility);
      } else {
        setColVisibility(visibility);
      }
    },
    [externalOnColumnVisibilityChange],
  );

  const {
    table,
    draggedColumn,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    resetColumns,
    dragActive,
  } = useEnhancedTable({
    data,
    columns,
    getRowId,
    pageSize,
    columnOrder: currentColumnOrder,
    columnVisibility: currentColumnVisibility,
    onColumnOrderChange: handleColumnOrderChange,
    onColumnVisibilityChange: handleColumnVisibilityChange,
    defaultColumnOrder: defaultColumnOrder ?? currentColumnOrder,
    defaultColumnVisibility: defaultColumnVisibility ?? currentColumnVisibility,
    onResetColumnState,
    enablePagination,
    enableSorting,
    enableFiltering,
  });

  // Build dropdown options from data if not provided externally
  const computedDropdownOptions = useMemo(() => {
    if (externalDropdownOptions) return externalDropdownOptions;
    if (!enableFiltering || derivedFilterColumns.length === 0) return {};
    return buildDropdownOptionsByColumnKey(
      derivedFilterColumns,
      data as Record<string, unknown>[],
    );
  }, [externalDropdownOptions, enableFiltering, derivedFilterColumns, data]);

  const filterResult = useTableFilters({
    table,
    columns: derivedFilterColumns,
    dropdownOptionsByColumnKey: computedDropdownOptions,
    isRealtimeFilterColumn,
  });

  const handleExport = useCallback(async () => {
    if (!enableExport) return;
    try {
      const filteredRows = table.getFilteredRowModel().rows;
      const filteredData = filteredRows.map((row) => row.original);

      const storeColumnMap = new Map(
        derivedFilterColumns.map((col) => [col.columnKey, col.columnName ?? col.columnKey]),
      );
      const exportColumns = getVisibleTableColumns(table).map((col) => ({
        id: col.id,
        label: storeColumnMap.get(col.id) ?? col.id,
      }));

      await exportToExcel(filteredData, exportColumns, {
        fileName: exportFileName,
        sheetName: exportSheetName,
      });
    } catch (error) {
      console.error("Export failed:", error);
      throw error;
    }
  }, [enableExport, table, derivedFilterColumns, exportFileName, exportSheetName]);

  const rows = enablePagination
    ? table.getPaginationRowModel().rows
    : table.getRowModel().rows;

  const isEmpty = rows.length === 0;

  return (
    <div ref={tableRef} className={cn("flex flex-col", className)}>
      <div className="rounded-md border overflow-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;
                  const isDragging = draggedColumn === columnId;
                  const canSort = enableSorting && header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  const handleSortClick = canSort
                    ? (e: React.MouseEvent) => {
                        if (dragActive.current) {
                          dragActive.current = false;
                          return;
                        }
                        header.column.getToggleSortingHandler()?.(e);
                      }
                    : undefined;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "relative group",
                        canSort && "cursor-pointer select-none",
                        isDragging && "opacity-50",
                      )}
                      onClick={handleSortClick}
                      draggable={enableColumnReorder}
                      onDragStart={
                        enableColumnReorder
                          ? (e) => handleDragStart(e, columnId)
                          : undefined
                      }
                      onDragOver={enableColumnReorder ? handleDragOver : undefined}
                      onDrop={
                        enableColumnReorder
                          ? (e) => handleDrop(e, columnId)
                          : undefined
                      }
                      onDragEnd={enableColumnReorder ? handleDragEnd : undefined}
                    >
                      <div className="flex items-center gap-2">
                        {enableColumnReorder && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex items-center gap-1 flex-1">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                          {canSort && (
                            sortDir === "asc" ? (
                              <ArrowUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : sortDir === "desc" ? (
                              <ArrowDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                            )
                          )}
                        </div>
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
            {enableFiltering && showFilterRow && (
              <FilterRow
                table={table}
                filterConfigs={filterResult.filterConfigs}
                getFilterValue={filterResult.getFilterValue as (key: string) => string}
                setFilterInputs={filterResult.setFilterInputs}
                isRealtimeFilterColumn={filterResult.isRealtimeFilterColumn}
                isFilterEnabledColumn={filterResult.isFilterEnabledColumn}
              />
            )}
          </TableHeader>
          <TableBody
            className={cn(tableBodySurfaceClassName, isEmpty && tableBodySurfaceEmptyClassName)}
          >
            {!isEmpty ? (
              rows.map((row) => {
                const isSelected =
                  selectedRowId != null && String(row.id) === String(selectedRowId);
                const isHighlighted =
                  !isSelected &&
                  highlightedRowId != null &&
                  String(row.id) === String(highlightedRowId);

                return (
                  <TableRow
                    key={row.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      tableDataRowClassName,
                      onRowClick && "cursor-pointer",
                      isHighlighted && "!bg-accent/50",
                    )}
                    onDoubleClick={
                      onRowClick ? () => onRowClick(row.original) : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={tableBodyCellClassName}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow className={tableEmptyStateRowClassName}>
                <TableCell
                  colSpan={columns.length}
                  className={tableEmptyStateCellClassName}
                >
                  <div className={tableEmptyStateContentClassName}>
                    <p className="text-base font-medium mb-2">
                      {emptyStateMessage}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {emptyStateSubMessage}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <PaginationBar
          table={table}
          onClearFilters={enableFiltering ? filterResult.clearAllFilters : undefined}
          onResetColumns={resetColumns}
          onExport={enableExport ? handleExport : undefined}
        />
      )}
    </div>
  );
}
