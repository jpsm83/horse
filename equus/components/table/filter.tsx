"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { type Table } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableHead, TableRow } from "@/components/ui/table";

import { useDebouncedValue } from "@/hooks/use-debounced-value";

import type {
  ColumnFilterConfig,
  FilterOptions,
  TableColumnFilterConfig,
} from "./types";
import { applyFilterToColumn, isFlagIconColumn } from "./utils";
import { FlagCell } from "./flag-cell";

// ============================================================================
// useTableFilters Hook (from useTableColumnFilters.ts)
// ============================================================================

function buildAllSelectedMap(
  dropdownColumns: Array<{ columnKey: string; options: FilterOptions[] }>,
): Record<string, string[]> {
  const next: Record<string, string[]> = {};
  dropdownColumns.forEach(({ columnKey, options }) => {
    next[columnKey] = options.map((opt) => opt.value);
  });
  return next;
}

function serializeDropdownOptionsMap(
  map: Record<string, FilterOptions[]>,
): string {
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, opts]) => `${key}:${opts.map((o) => o.value).join("\x1f")}`)
    .join(";");
}

function areDropdownSelectionsEqual(
  prev: Record<string, string[]>,
  next: Record<string, string[]>,
): boolean {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;
  return nextKeys.every((key) => {
    const prevValues = prev[key];
    const nextValues = next[key];
    if (!prevValues || !nextValues || prevValues.length !== nextValues.length) return false;
    return prevValues.every((value, index) => value === nextValues[index]);
  });
}

export function useTableFilters<TData = Record<string, unknown>>({
  table,
  columns = [],
  dropdownOptionsByColumnKey = {},
  isRealtimeFilterColumn,
}: {
  table: Table<TData>;
  columns?: TableColumnFilterConfig[];
  dropdownOptionsByColumnKey?: Record<string, FilterOptions[]>;
  isRealtimeFilterColumn?: (columnKey: string) => boolean;
}) {
  const t = useTranslations("table");

  const hasConfiguredFilters = useMemo(
    () => columns.some((col) => col.filter === "dropdown" || col.filter === "input"),
    [columns],
  );

  const filterColumnsKey = useMemo(
    () => columns.map((col) => `${col.columnKey}:${col.filter ?? ""}`).join(";"),
    [columns],
  );

  const dropdownOptionsMapKey = serializeDropdownOptionsMap(dropdownOptionsByColumnKey);

  const dropdownColumns = useMemo(() => {
    if (columns.length === 0) return [];
    const result: Array<{ columnKey: string; options: FilterOptions[] }> = [];
    for (const col of columns) {
      if (col.filter !== "dropdown") continue;
      const options = dropdownOptionsByColumnKey[col.columnKey];
      if (options?.length) result.push({ columnKey: col.columnKey, options });
    }
    return result;
  }, [filterColumnsKey, dropdownOptionsMapKey]);

  const dropdownOptionsKey = useMemo(
    () =>
      dropdownColumns
        .map((col) => `${col.columnKey}:${col.options.map((o) => o.value).join("\x1f")}`)
        .join(";"),
    [dropdownColumns],
  );

  const [dropdownSelections, setDropdownSelections] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const nextSelections = buildAllSelectedMap(dropdownColumns);
    setDropdownSelections((prev) =>
      areDropdownSelectionsEqual(prev, nextSelections) ? prev : nextSelections,
    );
  }, [dropdownOptionsKey]);

  useEffect(() => {
    if (!table?.getAllColumns?.() || table.getAllColumns().length === 0) return;
    dropdownColumns.forEach(({ columnKey, options }) => {
      applyFilterToColumn(
        table,
        columnKey,
        dropdownSelections[columnKey] ?? options.map((opt) => opt.value),
        options,
      );
    });
  }, [dropdownSelections, dropdownOptionsKey]);

  const handleDropdownToggle = useCallback(
    (columnKey: string, item: string, checked: boolean) => {
      setDropdownSelections((prev) => {
        const current = prev[columnKey] ?? [];
        if (checked) return { ...prev, [columnKey]: [...current, item] };
        return { ...prev, [columnKey]: current.filter((value) => value !== item) };
      });
    },
    [],
  );

  const handleDropdownSelectAll = useCallback(
    (columnKey: string, options: FilterOptions[]) => {
      setDropdownSelections((prev) => {
        const current = prev[columnKey] ?? [];
        if (current.length < options.length) {
          return { ...prev, [columnKey]: options.map((opt) => opt.value) };
        }
        return { ...prev, [columnKey]: [] };
      });
    },
    [],
  );

  const filterConfigs: ColumnFilterConfig[] = useMemo(
    () =>
      dropdownColumns.map(({ columnKey, options }) => {
        const columnDef = columns.find((col) => col.columnKey === columnKey);
        const icon = isFlagIconColumn(columnDef?.config) ? ("flag" as const) : undefined;
        return {
          columnKey,
          filterType: "dropdown" as const,
          icon,
          options,
          selectedValues: dropdownSelections[columnKey] ?? options.map((opt) => opt.value),
          onToggle: (value: string, checked: boolean) =>
            handleDropdownToggle(columnKey, value, checked),
          onSelectAllToggle: () => handleDropdownSelectAll(columnKey, options),
        };
      }),
    [columns, dropdownColumns, dropdownSelections, handleDropdownToggle, handleDropdownSelectAll],
  );

  const [filterInputs, setFilterInputs] = useState<Record<string, string>>({});

  const getFilterValue = useCallback(
    (columnKey: string): string => filterInputs[columnKey] || "",
    [filterInputs],
  );

  const isFilterEnabledColumn = useCallback(
    (columnKey: string) => {
      const col = columns.find((c) => c.columnKey === columnKey);
      return col?.filter === "dropdown" || col?.filter === "input";
    },
    [columns],
  );

  const resetDropdownSelections = useCallback(() => {
    setDropdownSelections(buildAllSelectedMap(dropdownColumns));
  }, [dropdownColumns]);

  const clearAllFilters = useCallback(() => {
    setFilterInputs({});
    table.resetColumnFilters();
    resetDropdownSelections();
    if (hasConfiguredFilters) {
      toast.success(t("filter.filtersCleared"), {
        duration: 2000,
        closeButton: false,
      });
    }
  }, [table, hasConfiguredFilters, resetDropdownSelections, t]);

  const clearFilterInputs = useCallback(() => {
    setFilterInputs({});
    resetDropdownSelections();
  }, [resetDropdownSelections]);

  const clearHiddenColumnFilters = useCallback(() => {
    const hiddenColumns = table.getAllColumns().filter((column) => !column.getIsVisible());
    if (hiddenColumns.length === 0) return;

    setFilterInputs((prev) => {
      const next = { ...prev };
      hiddenColumns.forEach((column) => {
        const col = columns.find((c) => c.columnKey === column.id);
        if (col?.filter === "input") delete next[column.id];
      });
      return next;
    });

    setDropdownSelections((prev) => {
      const next = { ...prev };
      hiddenColumns.forEach((column) => {
        const col = columns.find((c) => c.columnKey === column.id);
        if (col?.filter !== "dropdown") return;
        const config = dropdownColumns.find((item) => item.columnKey === column.id);
        if (config) next[column.id] = config.options.map((opt) => opt.value);
      });
      return next;
    });

    hiddenColumns.forEach((column) => {
      const col = columns.find((c) => c.columnKey === column.id);
      if (col?.filter === "dropdown" || col?.filter === "input") {
        column.setFilterValue(undefined);
      }
    });
  }, [table, dropdownColumns, columns]);

  return {
    filterConfigs,
    setFilterInputs,
    getFilterValue,
    isFilterEnabledColumn,
    isRealtimeFilterColumn,
    clearAllFilters,
    clearFilterInputs,
    clearHiddenColumnFilters,
  };
}

// ============================================================================
// FilterRow Component (from GenericTableFilter.tsx)
// ============================================================================

interface FilterRowProps<TData> {
  table: Table<TData>;
  filterConfigs?: ColumnFilterConfig[];
  getFilterValue?: (columnKey: string) => string;
  setFilterInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isRealtimeFilterColumn?: (columnKey: string) => boolean;
  isFilterEnabledColumn?: (columnKey: string) => boolean;
}

function FilterTextInput<TData = Record<string, unknown>>({
  columnKey,
  table,
  value,
  setFilterInputs,
  isRealtime,
  t,
}: {
  columnKey: string;
  table: Table<TData>;
  value: string;
  setFilterInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isRealtime: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  const debounceMs = table.getColumn(columnKey)?.columnDef.meta?.debounceMs ?? 0;
  const debouncedValue = useDebouncedValue(value, debounceMs > 0 ? debounceMs : 0);

  useEffect(() => {
    if (debounceMs <= 0) return;
    const column = table.getColumn(columnKey);
    if (!column) return;
    const nextFilterValue = debouncedValue || undefined;
    if (column.getFilterValue() === nextFilterValue) return;
    column.setFilterValue(nextFilterValue);
  }, [debouncedValue, debounceMs, columnKey]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setFilterInputs((prev) => ({ ...prev, [columnKey]: newValue }));

    if (debounceMs > 0) return;

    if (isRealtime) {
      table.getColumn(columnKey)?.setFilterValue(newValue);
    } else if (newValue === "") {
      table.getColumn(columnKey)?.setFilterValue(undefined);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (debounceMs > 0) return;
    if (!isRealtime && event.key === "Enter") {
      table.getColumn(columnKey)?.setFilterValue((event.target as HTMLInputElement).value || undefined);
    }
  };

  return (
    <Input
      placeholder={debounceMs > 0 ? t("filter.typeToFilter") : isRealtime ? t("filter.typeToFilter") : t("filter.enterToFilter")}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      className="w-full"
    />
  );
}

export function FilterRow<TData = Record<string, unknown>>({
  table,
  filterConfigs = [],
  getFilterValue,
  setFilterInputs,
  isRealtimeFilterColumn,
  isFilterEnabledColumn,
}: FilterRowProps<TData>) {
  const t = useTranslations("table");

  const filterConfigMap = useMemo(() => {
    const map = new Map<string, ColumnFilterConfig>();
    filterConfigs.forEach((config) => map.set(config.columnKey, config));
    return map;
  }, [filterConfigs]);

  const headers = table.getHeaderGroups()[0]?.headers || [];

  const renderFilter = (columnKey: string) => {
    const column = table.getColumn(columnKey);
    if (!column) return null;

    if (isFilterEnabledColumn && !isFilterEnabledColumn(columnKey)) return null;

    const filterConfig = filterConfigMap.get(columnKey);

    if (!filterConfig) {
      const isRealtime = isRealtimeFilterColumn?.(columnKey) ?? false;
      return (
        <FilterTextInput
          columnKey={columnKey}
          table={table}
          value={getFilterValue?.(columnKey) || ""}
          setFilterInputs={setFilterInputs!}
          isRealtime={isRealtime}
          t={t}
        />
      );
    }

    if (filterConfig.filterType === "dropdown" && filterConfig.options) {
      const selectedCount = filterConfig.selectedValues?.length || 0;
      const totalCount = filterConfig.options.length;
      const isAllSelected = selectedCount === totalCount;
      const soleSelected = filterConfig.selectedValues?.[0];
      const soleLabel =
        soleSelected !== undefined
          ? filterConfig.options.find((opt) => opt.value === soleSelected)?.label ?? soleSelected
          : "";
      const displayText =
        selectedCount === 0
          ? t("filter.all")
          : selectedCount === 1
            ? soleLabel
            : `${selectedCount} ${t("filter.selected")}`;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-between")}>
            <span className="min-w-0 flex-1 truncate text-left">
              {selectedCount === 1 && filterConfig.icon === "flag"
                ? renderDropdownLabel(soleLabel, filterConfig)
                : displayText}
            </span>
            <ChevronDown className="h-3 w-3 ml-2 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 max-h-80" align="start">
            <div className="px-3 py-2 text-sm font-semibold text-foreground border-b border-border bg-muted">
              {t("filter.filterBy")} {columnKey}
            </div>
            <div className="p-1">
              <div
                className="flex items-center space-x-3 px-2 py-2 rounded-sm border-b border-border mb-1 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={filterConfig.onSelectAllToggle}
              >
                <Checkbox checked={isAllSelected} className="h-4 w-4" />
                <span className="text-sm font-medium text-foreground flex-1">
                  {isAllSelected ? t("filter.unselectAll") : t("filter.selectAll")}
                </span>
              </div>

              {filterConfig.options.map((option) => {
                const isSelected = filterConfig.selectedValues?.includes(option.value) || false;
                return (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 px-2 py-1.5 hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                    onClick={() => filterConfig.onToggle?.(option.value, !isSelected)}
                  >
                    <Checkbox checked={isSelected} className="h-4 w-4" />
                    <div className="text-sm text-muted-foreground flex-1 min-w-0">
                      {renderDropdownLabel(option.label, filterConfig)}
                    </div>
                  </div>
                );
              })}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    const isRealtime = isRealtimeFilterColumn?.(columnKey) ?? false;
    return (
      <FilterTextInput
        columnKey={columnKey}
        table={table}
        value={getFilterValue?.(columnKey) || ""}
        setFilterInputs={setFilterInputs!}
        isRealtime={isRealtime}
        t={t}
      />
    );
  };

  return (
    <TableRow>
      {headers.map((header) => {
        if (header.isPlaceholder) return null;
        const columnKey = header.column.id;
        const canFilter = (isFilterEnabledColumn?.(columnKey) ?? header.column.getCanFilter?.()) ?? true;
        return (
          <TableHead key={`filter-${columnKey}`}>
            {canFilter ? renderFilter(columnKey) : null}
          </TableHead>
        );
      })}
    </TableRow>
  );
}

function renderDropdownLabel(text: string, filterConfig: ColumnFilterConfig) {
  if (filterConfig.icon !== "flag") {
    return <span className="truncate">{text}</span>;
  }
  return <FlagCell value={text} emptyLabel={text} align="start" />;
}
