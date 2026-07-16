"use client";

import type { ColumnDef, Table as TanStackTable } from "@tanstack/react-table";

// --- Column Cell Config (from tableColumnConfig.ts) ---

export type TableColumnColorRange = Record<string, string>;

export interface ITableColumnCellConfig {
  icon?: string;
  colorRange?: TableColumnColorRange;
  [key: string]: unknown;
}

// --- Color Range Types ---

export type TailwindBasicPaletteKey =
  | "gray" | "yellow" | "green" | "red" | "orange" | "blue" | "purple" | "pink";

export interface ColorBandConfig {
  className: string;
  style: { backgroundColor: string; color: string; borderColor: string };
}

export type ColorRangeBadgeView =
  | { type: "empty" }
  | { type: "plain"; text: string }
  | { type: "badge"; className: string; label: string; style: { backgroundColor: string; color: string; borderColor: string } };

export type ColorRangeBadgeLayout = "table" | "fill";

export type ColorRangeValidationErrorCode =
  | "noPalette" | "missingEnds" | "endOutOfRange" | "firstBandTooHigh"
  | "overlap" | "lastEditableTooHigh" | "maxBands" | "unknownPalette";

export interface ColorRangeValidationIssue {
  code: ColorRangeValidationErrorCode;
  band?: number;
  minEnd?: number;
}

export interface ColorRangeEndsValidation {
  valid: boolean;
  errors: ColorRangeValidationIssue[];
}

// --- Filter Contracts (from tableFilterContracts.ts) ---

export interface TableColumnFilterConfig {
  columnKey: string;
  columnName?: string;
  filter?: FilterType;
  config?: ITableColumnCellConfig;
}

export interface FilterOptions {
  value: string;
  label: string;
}

export type FilterType = "dropdown" | "input";

export interface ColumnFilterConfig {
  columnKey: string;
  filterType: FilterType;
  icon?: "flag";
  options?: FilterOptions[];
  selectedValues?: string[];
  onToggle?: (value: string, checked: boolean) => void;
  onSelectAllToggle?: () => void;
}

// --- Export Contracts (from tableExportContracts.ts) ---

export interface ExportColumn {
  id: string;
  label: string;
  formatValue?: (value: unknown) => unknown;
}

export interface ExportOptions {
  fileName?: string;
  sheetName?: string;
  onProgress?: (progress: number) => void;
  columnWidth?: number;
}

export interface VisibleColumnsTable {
  getAllColumns: () => Array<{ id: string; getIsVisible: () => boolean }>;
  getState: () => { columnOrder: string[] };
}

// --- Component Props (from tableComponentProps.ts) ---

export interface GenericTableHeaderProps<TData> {
  table: TanStackTable<TData>;
  children?: React.ReactNode;
  showFilterRow?: boolean;
  config?: {
    isDraggable?: boolean;
    draggedColumn?: string | null;
    onDragStart?: (e: React.DragEvent, columnId: string) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onDrop?: (e: React.DragEvent, targetColumnId: string) => void;
    onDragEnd?: () => void;
  };
}

export interface GenericTableFilterProps<TData> {
  table: TanStackTable<TData>;
  filterConfigs?: ColumnFilterConfig[];
  getFilterValue?: (columnKey: string) => string;
  setFilterInputs?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isRealtimeFilterColumn?: (columnKey: string) => boolean;
  isFilterEnabledColumn?: (columnKey: string) => boolean;
}

export interface GenericTableBodyProps<TData> {
  table: TanStackTable<TData>;
  columns: ColumnDef<TData, unknown>[];
  emptyStateMessage?: string;
  emptyStateSubMessage?: string;
  onRowClick?: (row: TData) => void;
  selectedRowId?: string | null;
  highlightedRowId?: string | null;
}

export interface GenericTablePaginationProps<TData> {
  table: TanStackTable<TData>;
  onClearFilters?: () => void;
  onResetColumns?: () => void;
  onExport?: () => void;
  enabledColumnIds?: string[];
}

// --- Layout Types (from mergeTableColumnLayout.ts) ---

export interface TableColumnForLayout {
  columnKey: string;
  enable: boolean;
  order: number;
  visible: boolean;
}

export interface TableColumnLayout {
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
}

// --- Enhanced Table Types (from useEnhancedTable.ts) ---

export interface UseEnhancedTableConfig<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  getRowId?: (row: TData, index: number) => string;
  pageSize?: number;
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  onColumnOrderChange: (order: string[]) => void;
  onColumnVisibilityChange: (visibility: Record<string, boolean>) => void;
  defaultColumnOrder?: string[];
  defaultColumnVisibility?: Record<string, boolean>;
  onResetColumnState?: () => void;
  enablePagination?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

export interface UseEnhancedTableReturn<TData> {
  table: TanStackTable<TData>;
  draggedColumn: string | null;
  handleDragStart: (e: React.DragEvent, columnId: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetColumnId: string) => void;
  handleDragEnd: () => void;
  resetColumns: () => void;
  dragActive: React.RefObject<boolean>;
}

// --- Filter Hook Types (from useTableColumnFilters.ts) ---

export interface UseTableColumnFiltersConfig<TData> {
  table: TanStackTable<TData>;
  columns?: TableColumnFilterConfig[];
  dropdownOptionsByColumnKey?: Record<string, FilterOptions[]>;
  isRealtimeFilterColumn?: (columnKey: string) => boolean;
}

// --- Export Hook Types (from useTableExport.ts) ---

export type TableExportStoreColumn = {
  columnKey: string;
  columnName: string;
};

export interface UseTableExportConfig<TData> {
  table: TanStackTable<TData>;
  storeColumns: TableExportStoreColumn[];
  fileName: string;
  sheetName: string;
  onError?: (error: Error, context?: string) => Promise<void>;
}

// --- Dropdown Reference (from buildDropdownOptionsByColumnKey.ts) ---

export type DropdownReferenceEntry = {
  patterns: string[];
  options: FilterOptions[];
};

// --- DataTable Props (main consumer interface) ---

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    dataType?: "string" | "number" | "date" | "boolean";
    debounceMs?: number;
  }
}

export type DataTableColumnDef<TData> = ColumnDef<TData, unknown> & {
  filterType?: FilterType;
  filterConfig?: ITableColumnCellConfig;
};

export interface DataTableProps<TData> {
  data: TData[];
  columns: DataTableColumnDef<TData>[];
  getRowId?: (row: TData, index: number) => string;
  pageSize?: number;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableColumnReorder?: boolean;
  enableExport?: boolean;
  emptyStateMessage?: string;
  emptyStateSubMessage?: string;
  onRowClick?: (row: TData) => void;
  selectedRowId?: string | null;
  highlightedRowId?: string | null;
  columnOrder?: string[];
  columnVisibility?: Record<string, boolean>;
  onColumnOrderChange?: (order: string[]) => void;
  onColumnVisibilityChange?: (visibility: Record<string, boolean>) => void;
  defaultColumnOrder?: string[];
  defaultColumnVisibility?: Record<string, boolean>;
  onResetColumnState?: () => void;
  exportFileName?: string;
  exportSheetName?: string;
  filterColumns?: TableColumnFilterConfig[];
  dropdownOptionsByColumnKey?: Record<string, FilterOptions[]>;
  isRealtimeFilterColumn?: (columnKey: string) => boolean;
  showFilterRow?: boolean;
  className?: string;
}
