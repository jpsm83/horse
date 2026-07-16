"use client";

import type { FilterFn, Table } from "@tanstack/react-table";
import { Workbook } from "exceljs";

import type {
  ColorBandConfig,
  ColorRangeBadgeView,
  ColorRangeEndsValidation,
  ColorRangeValidationIssue,
  ExportColumn,
  ExportOptions,
  FilterOptions,
  ITableColumnCellConfig,
  TableColumnColorRange,
  TableColumnFilterConfig,
  TableColumnForLayout,
  TableColumnLayout,
  TailwindBasicPaletteKey,
  VisibleColumnsTable,
} from "./types";

// ============================================================================
// Color Range Helpers (from domain/entities/tableColumnConfig.ts)
// ============================================================================

const RANGE_PATTERN = /^\d+-\d+$/;

export function parseTableColumnCellConfig(
  raw: unknown,
): ITableColumnCellConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const config = raw as Record<string, unknown>;
  const result: ITableColumnCellConfig = {};

  for (const [key, value] of Object.entries(config)) {
    if (key === "icon" || key === "colorRange") continue;
    result[key] = value;
  }

  const icon = typeof config.icon === "string" ? config.icon : undefined;
  if (icon) result.icon = icon;

  const colorRange = parseColorRange(config.colorRange);
  if (colorRange) result.colorRange = colorRange;

  if (!result.icon && !result.colorRange && Object.keys(result).length === 0) return undefined;
  return result;
}

function parseColorRange(raw: unknown): TableColumnColorRange | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: TableColumnColorRange = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof key !== "string" || !key.trim()) continue;
    if (typeof value === "string" && RANGE_PATTERN.test(value.trim())) {
      out[key] = value.trim();
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export function isFlagIconColumn(config?: ITableColumnCellConfig): boolean {
  return config?.icon === "flag";
}

export function isColorRangeColumn(config?: ITableColumnCellConfig): boolean {
  const range = config?.colorRange;
  return !!range && Object.keys(range).length > 0;
}

export function shouldRenderConfiguredTableCell(
  config?: ITableColumnCellConfig,
  semanticBandConfig?: ColorBandConfig,
): boolean {
  return isColorRangeColumn(config) || Boolean(semanticBandConfig);
}

export function parseRangeString(
  range: string,
): { min: number; max: number } | undefined {
  if (typeof range !== "string" || !RANGE_PATTERN.test(range.trim())) return undefined;
  const [minStr, maxStr] = range.trim().split("-");
  const min = Number(minStr);
  const max = Number(maxStr);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) return undefined;
  return { min, max };
}

export function getColorRangeBandKeys(colorRange: TableColumnColorRange): string[] {
  return Object.keys(colorRange);
}

export function resolveColorBand(
  value: unknown,
  colorRange: TableColumnColorRange,
): string | undefined {
  let num: number | undefined;
  if (typeof value === "number" && !Number.isNaN(value)) {
    num = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseFloat(value);
    num = Number.isNaN(parsed) ? undefined : parsed;
  }
  if (num === undefined) return undefined;

  for (const key of getColorRangeBandKeys(colorRange)) {
    const bounds = parseRangeString(colorRange[key]);
    if (bounds && num >= bounds.min && num <= bounds.max) return key;
  }
  return undefined;
}

export const TAILWIND_BASIC_PALETTE_KEYS = [
  "gray", "yellow", "green", "red", "orange", "blue", "purple", "pink",
] as const;

export const COLOR_RANGE_MAX_BANDS = TAILWIND_BASIC_PALETTE_KEYS.length;

const PALETTE_KEY_SET = new Set<string>(TAILWIND_BASIC_PALETTE_KEYS);

export function isKnownPaletteKey(key: string): boolean {
  return PALETTE_KEY_SET.has(key.trim().toLowerCase());
}

export function getAvailablePaletteKeys(usedKeys: string[]): string[] {
  const used = new Set(usedKeys.map((k) => k.trim().toLowerCase()));
  return TAILWIND_BASIC_PALETTE_KEYS.filter((k) => !used.has(k));
}

export function addColorRangeBand(
  paletteKeys: string[],
  ends: number[],
  newKey: string,
): { paletteKeys: string[]; ends: number[] } {
  const key = newKey.trim().toLowerCase();
  const used = new Set(paletteKeys.map((k) => k.trim().toLowerCase()));
  if (!key || !isKnownPaletteKey(key) || used.has(key)) {
    return { paletteKeys: [...paletteKeys], ends: [...ends] };
  }
  if (paletteKeys.length >= COLOR_RANGE_MAX_BANDS) {
    return { paletteKeys: [...paletteKeys], ends: [...ends] };
  }
  if (paletteKeys.length === 0) {
    return { paletteKeys: [key], ends: [] };
  }
  const firstSegmentEnd = ends.length > 0 ? ends[0] : 100;
  const newEnd = Math.min(99, Math.max(0, Math.floor(firstSegmentEnd / 2)));
  return {
    paletteKeys: [key, ...paletteKeys],
    ends: [newEnd, ...ends],
  };
}

export function removeColorRangeBand(
  paletteKeys: string[],
  ends: number[],
  index: number,
): { paletteKeys: string[]; ends: number[] } {
  if (paletteKeys.length <= 1) return { paletteKeys: [...paletteKeys], ends: [...ends] };
  if (index < 0 || index >= paletteKeys.length - 1) return { paletteKeys: [...paletteKeys], ends: [...ends] };
  return {
    paletteKeys: paletteKeys.filter((_, i) => i !== index),
    ends: ends.filter((_, i) => i !== index),
  };
}

export function parseColorRangeToEnds(colorRange: TableColumnColorRange): {
  paletteKeys: string[];
  ends: number[];
} {
  const paletteKeys = getColorRangeBandKeys(colorRange);
  const ends: number[] = [];
  for (let i = 0; i < paletteKeys.length - 1; i++) {
    const bounds = parseRangeString(colorRange[paletteKeys[i]]);
    if (!bounds) return { paletteKeys, ends: [] };
    ends.push(bounds.max);
  }
  return { paletteKeys, ends };
}

export function buildColorRangeStrings(
  paletteKeys: string[],
  ends: number[],
): TableColumnColorRange {
  const out: TableColumnColorRange = {};
  if (paletteKeys.length === 0) return out;
  if (paletteKeys.length === 1) {
    out[paletteKeys[0]] = "0-100";
    return out;
  }
  let start = 0;
  for (let i = 0; i < paletteKeys.length; i++) {
    const isLast = i === paletteKeys.length - 1;
    let end: number;
    if (isLast) {
      end = 100;
    } else {
      const candidate = ends[i];
      const numeric = typeof candidate === "number" && Number.isFinite(candidate) ? candidate : start;
      end = Math.max(start, Math.min(99, numeric));
    }
    out[paletteKeys[i]] = `${start}-${end}`;
    start = end + 1;
  }
  return out;
}

export function validateColorRangeEnds(
  paletteKeys: string[],
  ends: number[],
): ColorRangeEndsValidation {
  const errors: ColorRangeValidationIssue[] = [];
  if (paletteKeys.length === 0) return { valid: false, errors: [{ code: "noPalette" as const }] };
  if (paletteKeys.length > COLOR_RANGE_MAX_BANDS) errors.push({ code: "maxBands" as const });
  for (const key of paletteKeys) {
    if (!isKnownPaletteKey(key)) { errors.push({ code: "unknownPalette" as const }); break; }
  }
  if (ends.length !== paletteKeys.length - 1) errors.push({ code: "missingEnds" as const });
  if (paletteKeys.length === 1) return { valid: errors.length === 0, errors };

  for (let i = 0; i < ends.length; i++) {
    const end = ends[i];
    if (!Number.isInteger(end) || end < 0 || end > 100) {
      errors.push({ code: "endOutOfRange" as const });
      continue;
    }
    if (i === 0) {
      if (end > 99) errors.push({ code: "firstBandTooHigh" as const });
    } else {
      const previousEnd = ends[i - 1];
      if (end <= previousEnd) errors.push({ code: "overlap" as const, band: i + 1, minEnd: previousEnd + 1 });
    }
  }
  const lastEditableEnd = ends[ends.length - 1];
  if (Number.isInteger(lastEditableEnd) && lastEditableEnd > 99) {
    errors.push({ code: "lastEditableTooHigh" as const });
  }
  return { valid: errors.length === 0, errors };
}

export const COLOR_BAND_CONFIGS: Record<string, ColorBandConfig> = {
  gray:   { className: "badge-band-gray",   style: { backgroundColor: "#5c5b5b", color: "#ffffff", borderColor: "#5c5b5b" } },
  yellow: { className: "badge-band-yellow",  style: { backgroundColor: "#ecd6a7", color: "#92400e", borderColor: "#ecd6a7" } },
  green:  { className: "badge-band-green",   style: { backgroundColor: "#addfc0", color: "#166534", borderColor: "#addfc0" } },
  red:    { className: "badge-band-red",     style: { backgroundColor: "#f3cbcb", color: "#991b1b", borderColor: "#f3cbcb" } },
  orange: { className: "badge-band-orange",  style: { backgroundColor: "#f8c5aa", color: "#c2410c", borderColor: "#f8c5aa" } },
  blue:   { className: "badge-band-blue",    style: { backgroundColor: "#b3c8f8", color: "#1e40af", borderColor: "#b3c8f8" } },
  purple: { className: "badge-band-purple",  style: { backgroundColor: "#d9b8f8", color: "#7e22ce", borderColor: "#d9b8f8" } },
  pink:   { className: "badge-band-pink",    style: { backgroundColor: "#f2b3cf", color: "#be185d", borderColor: "#f2b3cf" } },
  neutral: { className: "badge-band-neutral", style: { backgroundColor: "#e5e7eb", color: "#6b7280", borderColor: "#e5e7eb" } },
};

export const NEUTRAL_BADGE_CLASS = "badge-band-neutral";

export function colorBandBadgeClass(paletteKey: string): string {
  const color = paletteKey.trim().toLowerCase();
  return COLOR_BAND_CONFIGS[color]?.className ?? NEUTRAL_BADGE_CLASS;
}

export function colorBandSwatchClass(paletteKey: string): string {
  const color = paletteKey.trim().toLowerCase() as TailwindBasicPaletteKey;
  const SWATCH_CLASSES: Record<string, string> = {
    gray: "badge-band-swatch-gray", yellow: "badge-band-swatch-yellow",
    green: "badge-band-swatch-green", red: "badge-band-swatch-red",
    orange: "badge-band-swatch-orange", blue: "badge-band-swatch-blue",
    purple: "badge-band-swatch-purple", pink: "badge-band-swatch-pink",
  };
  return SWATCH_CLASSES[color] ?? "bg-muted";
}

// ============================================================================
// Color Range Badge View (from application/utils/getColorRangeBadgeView.ts)
// ============================================================================

function parseNumericCellValue(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

export function getColorRangeBadgeView(
  value: unknown,
  colorRange: TableColumnColorRange,
): ColorRangeBadgeView {
  if (value === null || value === undefined) return { type: "empty" };
  if (typeof value === "string" && value.trim() === "") return { type: "empty" };

  const numValue = parseNumericCellValue(value);
  if (numValue === undefined) return { type: "plain", text: String(value) };

  const band = resolveColorBand(numValue, colorRange);
  const config = COLOR_BAND_CONFIGS[band ?? ""] ?? COLOR_BAND_CONFIGS.neutral;

  return {
    type: "badge",
    ...config,
    label: String(numValue),
  };
}

// ============================================================================
// Filter Utilities (from presentation/utils/applyFilterToColumn.ts)
// ============================================================================

const FORMATTED_FILTER_VALUE = /^(\d+):\s*(.+)$/;

export const tableColumnFilterFn: FilterFn<unknown> = (
  row,
  columnKey,
  filterValue,
) => {
  if (Array.isArray(filterValue) && filterValue.length === 0) return false;
  if (!filterValue) return true;

  const rawValue = row.getValue(columnKey);
  if (rawValue === null || rawValue === undefined) return false;

  const isArrayFilter = Array.isArray(filterValue);
  const filterValues = isArrayFilter ? filterValue : [filterValue];

  return filterValues.some((filterItem: string) => {
    const filterStr = String(filterItem);
    const filterStrLower = filterStr.toLowerCase();
    const rawValueStr = String(rawValue);
    const rawValueStrLower = rawValueStr.toLowerCase();

    const formattedMatch = filterStr.match(FORMATTED_FILTER_VALUE);
    if (formattedMatch) return rawValueStr === formattedMatch[1];

    if (isArrayFilter) return rawValueStrLower === filterStrLower;
    return rawValueStrLower.includes(filterStrLower);
  });
};

interface ApplyFilterToColumnOptions {
  onUnexpectedError?: (error: Error, context?: string) => void | Promise<void>;
  errorContext?: string;
}

function areColumnFilterValuesEqual(current: unknown, next: unknown): boolean {
  if (current === next) return true;
  if (current == null && next == null) return true;
  if (Array.isArray(current) && Array.isArray(next)) {
    return (
      current.length === next.length &&
      current.every((value, index) => value === next[index])
    );
  }
  return false;
}

export function applyFilterToColumn<TData>(
  table: Table<TData>,
  columnKey: string | null,
  selectedItems: string[],
  allOptions: FilterOptions[],
  options?: ApplyFilterToColumnOptions,
): void {
  if (!table?.getAllColumns || table.getAllColumns().length === 0 || !columnKey) return;
  try {
    const column = table.getColumn(columnKey);
    if (column) {
      const nextFilterValue =
        selectedItems.length === allOptions.length ? undefined : selectedItems;
      if (areColumnFilterValuesEqual(column.getFilterValue(), nextFilterValue)) return;
      column.setFilterValue(nextFilterValue);
    }
  } catch (error) {
    if (options?.onUnexpectedError) {
      const normalizedError = error instanceof Error ? error : new Error(String(error));
      void options.onUnexpectedError(
        normalizedError,
        options.errorContext ?? "table.filters.applyFilterToColumn",
      );
    }
  }
}

// ============================================================================
// Dropdown Options Builder (from application/utils/buildDropdownOptionsByColumnKey.ts)
// ============================================================================

export function findColumnKey(
  storeColumns: TableColumnFilterConfig[],
  searchPatterns: string[],
): string | null {
  if (storeColumns.length === 0) return null;
  for (const pattern of searchPatterns) {
    const found = storeColumns.find(
      (col) =>
        col.columnName?.toLowerCase() === pattern.toLowerCase() ||
        col.columnKey.toLowerCase() === pattern.toLowerCase(),
    );
    if (found) return found.columnKey;
  }
  return null;
}

function uniqueOptionsFromRows(
  data: Record<string, unknown>[],
  columnKey: string,
  getCellValue: (row: Record<string, unknown>, columnKey: string) => unknown,
): FilterOptions[] {
  const seen = new Set<string>();
  const values: string[] = [];
  for (const row of data) {
    const raw = getCellValue(row, columnKey);
    if (raw === null || raw === undefined) continue;
    const value = String(raw).trim();
    if (value === "") continue;
    if (!seen.has(value)) {
      seen.add(value);
      values.push(value);
    }
  }
  values.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));
  return values.map((value) => ({ value, label: value }));
}

export type DropdownReferenceEntry = {
  patterns: string[];
  options: FilterOptions[];
};

export function buildDropdownOptionsByColumnKey(
  columns: TableColumnFilterConfig[],
  data: Record<string, unknown>[],
  referenceEntries: DropdownReferenceEntry[] = [],
  getCellValue: (row: Record<string, unknown>, columnKey: string) => unknown = (row, columnKey) => row[columnKey],
): Record<string, FilterOptions[]> {
  const result: Record<string, FilterOptions[]> = {};

  for (const { patterns, options } of referenceEntries) {
    const key = findColumnKey(columns, patterns);
    if (key && options.length > 0) result[key] = options;
  }

  for (const col of columns) {
    if (col.filter !== "dropdown") continue;
    if (result[col.columnKey]?.length) continue;
    const fromRows = uniqueOptionsFromRows(data, col.columnKey, getCellValue);
    if (fromRows.length > 0) result[col.columnKey] = fromRows;
  }

  return result;
}

// ============================================================================
// Country Code Resolution (from application/countryCodeFromCellValue.ts)
// ============================================================================

const ALPHA3_TO_ALPHA2: Record<string, string> = {
  AFG: "AF", ALB: "AL", DZA: "DZ", AND: "AD", AGO: "AO", ARG: "AR", ARM: "AM",
  AUS: "AU", AUT: "AT", AZE: "AZ", BHS: "BS", BHR: "BH", BGD: "BD", BRB: "BB",
  BEL: "BE", BLZ: "BZ", BEN: "BJ", BTN: "BT", BOL: "BO", BIH: "BA", BWA: "BW",
  BRA: "BR", BRN: "BN", BGR: "BG", BFA: "BF", BDI: "BI", CPV: "CV", KHM: "KH",
  CMR: "CM", CAN: "CA", CAF: "CF", TCD: "TD", CHL: "CL", CHN: "CN", COL: "CO",
  COM: "KM", COG: "CG", COD: "CD", CRI: "CR", CIV: "CI", HRV: "HR", CUB: "CU",
  CYP: "CY", CZE: "CZ", DNK: "DK", DJI: "DJ", DMA: "DM", DOM: "DO", ECU: "EC",
  EGY: "EG", SLV: "SV", GNQ: "GQ", ERI: "ER", EST: "EE", SWZ: "SZ", ETH: "ET",
  FJI: "FJ", FIN: "FI", FRA: "FR", GAB: "GA", GMB: "GM", GEO: "GE", DEU: "DE",
  GHA: "GH", GRC: "GR", GRD: "GD", GTM: "GT", GIN: "GN", GNB: "GW", GUY: "GY",
  HTI: "HT", HND: "HN", HKG: "HK", HUN: "HU", ISL: "IS", IND: "IN", IDN: "ID",
  IRN: "IR", IRQ: "IQ", IRL: "IE", ISR: "IL", ITA: "IT", JAM: "JM", JPN: "JP",
  JOR: "JO", KAZ: "KZ", KEN: "KE", KIR: "KI", PRK: "KP", KOR: "KR", KWT: "KW",
  KGZ: "KG", LAO: "LA", LVA: "LV", LBN: "LB", LSO: "LS", LBR: "LR", LBY: "LY",
  LIE: "LI", LTU: "LT", LUX: "LU", MDG: "MG", MWI: "MW", MYS: "MY", MDV: "MV",
  MLI: "ML", MLT: "MT", MHL: "MH", MRT: "MR", MUS: "MU", MEX: "MX", FSM: "FM",
  MDA: "MD", MCO: "MC", MNG: "MN", MNE: "ME", MAR: "MA", MOZ: "MZ", MMR: "MM",
  NAM: "NA", NRU: "NR", NPL: "NP", NLD: "NL", NZL: "NZ", NIC: "NI", NER: "NE",
  NGA: "NG", MKD: "MK", NOR: "NO", OMN: "OM", PAK: "PK", PLW: "PW", PSE: "PS",
  PAN: "PA", PNG: "PG", PRY: "PY", PER: "PE", PHL: "PH", POL: "PL", PRT: "PT",
  QAT: "QA", ROU: "RO", RUS: "RU", RWA: "RW", KNA: "KN", LCA: "LC", VCT: "VC",
  WSM: "WS", SMR: "SM", STP: "ST", SAU: "SA", SEN: "SN", SRB: "RS", SYC: "SC",
  SLE: "SL", SGP: "SG", SVK: "SK", SVN: "SI", SLB: "SB", SOM: "SO", ZAF: "ZA",
  SSD: "SS", ESP: "ES", LKA: "LK", SDN: "SD", SUR: "SR", SWE: "SE", CHE: "CH",
  SYR: "SY", TWN: "TW", TJK: "TJ", TZA: "TZ", THA: "TH", TLS: "TL", TGO: "TG",
  TON: "TO", TTO: "TT", TUN: "TN", TUR: "TR", TKM: "TM", TUV: "TV", UGA: "UG",
  UKR: "UA", ARE: "AE", GBR: "GB", USA: "US", URY: "UY", UZB: "UZ", VUT: "VU",
  VAT: "VA", VEN: "VE", VNM: "VN", YEM: "YE", ZMB: "ZM", ZWE: "ZW",
};

function toAlpha2(code: string): string | null {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  if (/^[A-Z]{2}$/.test(normalized)) return normalized;
  if (/^[A-Z]{3}$/.test(normalized)) return ALPHA3_TO_ALPHA2[normalized] ?? null;
  return null;
}

export function countryCodeFromCellValue(value: string): string | null {
  const raw = value.trim();
  if (!raw || raw === "---") return null;

  const fromParen = raw.match(/\(([A-Za-z]{2,3})\)\s*$/);
  if (fromParen) return toAlpha2(fromParen[1]);

  const fromHyphen = raw.match(/^([A-Za-z]{2})-/);
  if (fromHyphen) return toAlpha2(fromHyphen[1]);

  return toAlpha2(raw);
}

// ============================================================================
// Column Layout (from application/utils/mergeTableColumnLayout.ts)
// ============================================================================

export function buildDefaultTableColumnLayout(
  columns: TableColumnForLayout[],
): TableColumnLayout {
  const enabled = columns
    .filter((column) => column.enable)
    .sort((a, b) => a.order - b.order);

  return {
    columnOrder: enabled.map((column) => column.columnKey),
    columnVisibility: enabled.reduce<Record<string, boolean>>((acc, column) => {
      acc[column.columnKey] = column.visible;
      return acc;
    }, {}),
  };
}

export function mergeTableColumnLayout(
  columns: TableColumnForLayout[],
  userPreferences: TableColumnLayout,
): TableColumnLayout {
  const defaults = buildDefaultTableColumnLayout(columns);
  if (userPreferences.columnOrder.length === 0) return defaults;

  const enabledKeys = new Set(defaults.columnOrder);
  const seen = new Set<string>();
  const columnOrder: string[] = [];

  for (const key of userPreferences.columnOrder) {
    if (!enabledKeys.has(key) || seen.has(key)) continue;
    seen.add(key);
    columnOrder.push(key);
  }

  for (const key of defaults.columnOrder) {
    if (!seen.has(key)) columnOrder.push(key);
  }

  const columnVisibility: Record<string, boolean> = {};
  for (const key of columnOrder) {
    columnVisibility[key] =
      key in userPreferences.columnVisibility
        ? userPreferences.columnVisibility[key] === true
        : defaults.columnVisibility[key];
  }

  return { columnOrder, columnVisibility };
}

// ============================================================================
// Export Utilities (from infrastructure/utils/exportDataExel.ts)
// ============================================================================

const YIELD_INTERVAL = 5000;
const PROGRESS_ROWS = 80;
const PROGRESS_BORDERS = 15;
const PROGRESS_FINAL = 5;

const yieldToBrowser = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const formatCellValue = (value: unknown, formatter?: (val: unknown) => unknown): unknown => {
  return formatter ? formatter(value) : (value ?? "-");
};

const BORDER_STYLE = {
  top: { style: "thin" as const, color: { argb: "000000" } },
  left: { style: "thin" as const, color: { argb: "000000" } },
  bottom: { style: "thin" as const, color: { argb: "000000" } },
  right: { style: "thin" as const, color: { argb: "000000" } },
};

const updateProgress = (onProgress: ((progress: number) => void) | undefined, progress: number) => {
  onProgress?.(progress);
};

export async function exportToExcel<TData = Record<string, unknown>>(
  dataRows: TData[],
  columns: ExportColumn[],
  options?: ExportOptions,
): Promise<void> {
  if (!dataRows?.length) { console.warn("No data to export"); return; }
  if (!columns?.length) { console.warn("No columns to export"); return; }

  const {
    fileName = "export",
    sheetName = "Data",
    onProgress,
    columnWidth = 20,
  } = options || {};

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map((column) => ({
    header: column.label,
    width: columnWidth,
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "D1D0CE" },
  };

  const totalRows = dataRows.length;
  const rows: unknown[][] = [];

  for (let i = 0; i < totalRows; i++) {
    const row = dataRows[i] as Record<string, unknown>;
    const rowData: unknown[] = new Array(columns.length);
    for (let j = 0; j < columns.length; j++) {
      rowData[j] = formatCellValue(row[columns[j].id], columns[j].formatValue);
    }
    rows.push(rowData);
    if ((i + 1) % YIELD_INTERVAL === 0) {
      await yieldToBrowser();
      updateProgress(onProgress, Math.round(((i + 1) / totalRows) * PROGRESS_ROWS));
    }
  }

  worksheet.addRows(rows);
  updateProgress(onProgress, PROGRESS_ROWS);

  const totalColumns = columns.length;
  const rowCount = worksheet.rowCount;
  const BORDER_BATCH_SIZE = 10;

  for (let colStart = 1; colStart <= totalColumns; colStart += BORDER_BATCH_SIZE) {
    const colEnd = Math.min(colStart + BORDER_BATCH_SIZE - 1, totalColumns);
    for (let i = colStart; i <= colEnd; i++) {
      const columnLetter = worksheet.getColumn(i).letter;
      for (let j = 1; j <= rowCount; j++) {
        worksheet.getCell(`${columnLetter}${j}`).border = BORDER_STYLE;
      }
    }
    if (colEnd < totalColumns) await yieldToBrowser();
    const progress = PROGRESS_ROWS + Math.round((colEnd / totalColumns) * PROGRESS_BORDERS);
    updateProgress(onProgress, progress);
  }

  updateProgress(onProgress, PROGRESS_ROWS + PROGRESS_BORDERS + PROGRESS_FINAL);

  const timestamp = new Date().toISOString().slice(0, 19).replace("T", "_").replace(/:/g, "-");
  const timestampedFileName = `${fileName}_${timestamp}`;

  await yieldToBrowser();
  const buffer = await workbook.xlsx.writeBuffer();
  updateProgress(onProgress, 100);

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${timestampedFileName}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function getVisibleTableColumns(table: VisibleColumnsTable): ExportColumn[] {
  const allColumns = table.getAllColumns();
  const columnOrder = table.getState().columnOrder;
  const columnMap = new Map(allColumns.map((col) => [col.id, col]));

  let orderedColumns = allColumns;
  if (columnOrder?.length) {
    orderedColumns = columnOrder
      .map((colId) => columnMap.get(colId))
      .filter((col): col is NonNullable<typeof col> => col !== undefined);
  }

  return orderedColumns
    .filter((column) => column.getIsVisible())
    .map((column) => ({ id: column.id, label: column.id }));
}

export function buildExportColumnsFromDataAndStore(
  rows: Record<string, unknown>[],
  storeColumns: Array<{ columnKey: string; columnName: string }>,
): ExportColumn[] {
  const storeColumnMap = new Map(storeColumns.map((col) => [col.columnKey, col.columnName]));
  const dataKeys = new Set<string>();
  for (const row of rows) Object.keys(row).forEach((key) => dataKeys.add(key));
  return Array.from(dataKeys).map((key) => ({
    id: key,
    label: storeColumnMap.get(key) ?? key,
  }));
}

// ============================================================================
// Presentation Classes (from presentation/utils/tablePresentationClasses.ts)
// ============================================================================

export const tableBodySurfaceClassName = "";

export const tableBodySurfaceEmptyClassName = "h-full";

export const tableDataRowClassName = "";

export const tableBodyCellClassName = "";

export const tableEmptyStateRowClassName = "hover:!bg-transparent border-0";

export const tableEmptyStateCellClassName =
  "p-0 text-muted-foreground text-center align-middle";

export const tableEmptyStateContentClassName =
  "pointer-events-none flex h-full w-full flex-col items-center justify-center";
