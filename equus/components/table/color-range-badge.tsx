"use client";

import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type {
  ColorBandConfig,
  ColorRangeBadgeLayout,
  ITableColumnCellConfig,
  TableColumnColorRange,
} from "./types";
import {
  COLOR_BAND_CONFIGS,
  TAILWIND_BASIC_PALETTE_KEYS,
  getAvailablePaletteKeys,
  getColorRangeBadgeView,
  isColorRangeColumn,
  parseColorRangeToEnds,
} from "./utils";

// ============================================================================
// ColorRangeBadge (from TABLE's ColorRangeBadge.tsx + ConfiguredTableCell)
// ============================================================================

interface ColoredTableValueBandProps {
  bandClassName: string;
  children: ReactNode;
  bandStyle?: React.CSSProperties;
}

function ColoredTableValueBand({
  bandClassName,
  children,
  bandStyle,
}: ColoredTableValueBandProps): ReactElement {
  return (
    <div className="flex h-full w-full items-center justify-center px-1 py-0.5">
      <span
        className={`px-2.5 py-0.5 text-[10px] leading-4 ${bandClassName}`}
        style={bandStyle}
      >
        {children}
      </span>
    </div>
  );
}

interface ColorRangeBadgeProps {
  value: unknown;
  colorRange: TableColumnColorRange;
  emptyLabel: string;
  layout?: ColorRangeBadgeLayout;
}

export function ColorRangeBadge({
  value,
  colorRange,
  emptyLabel,
  layout = "table",
}: ColorRangeBadgeProps): ReactElement {
  const view = getColorRangeBadgeView(value, colorRange);

  if (view.type === "empty") {
    return <span className="text-sm text-muted-foreground">{emptyLabel}</span>;
  }

  if (view.type === "plain") {
    return <span className="text-sm">{view.text}</span>;
  }

  if (layout === "fill") {
    return (
      <span className={`px-2.5 py-0.5 text-xs leading-4 ${view.className}`} style={view.style}>
        {view.label}
      </span>
    );
  }

  return (
    <ColoredTableValueBand bandClassName={view.className} bandStyle={view.style}>
      {view.label}
    </ColoredTableValueBand>
  );
}

interface ConfiguredTableCellProps {
  config?: ITableColumnCellConfig;
  emptyLabel: string;
  displayValue: unknown;
  colorRangeValue?: unknown;
  semanticBandConfig?: ColorBandConfig;
}

function hasDisplayContent(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  return true;
}

export function ConfiguredTableCell({
  config,
  emptyLabel,
  displayValue,
  colorRangeValue,
  semanticBandConfig,
}: ConfiguredTableCellProps): ReactElement | null {
  if (isColorRangeColumn(config)) {
    return (
      <ColorRangeBadge
        value={colorRangeValue ?? displayValue}
        colorRange={config!.colorRange!}
        emptyLabel={emptyLabel}
        layout="table"
      />
    );
  }

  if (semanticBandConfig && hasDisplayContent(displayValue)) {
    return (
      <ColoredTableValueBand
        bandClassName={semanticBandConfig.className}
        bandStyle={semanticBandConfig.style}
      >
        {String(displayValue)}
      </ColoredTableValueBand>
    );
  }

  return null;
}

export function TableDataCell({ children }: { children: ReactNode }): ReactElement {
  return <div className="flex justify-center items-center px-1">{children}</div>;
}

// ============================================================================
// ColorRangeEditor Component (from TABLE's ColorRangeEditor.tsx)
// ============================================================================

const SWATCH_SIZE = "h-7 w-7";

function swatchColor(paletteKey: string): string {
  const config = COLOR_BAND_CONFIGS[paletteKey] ?? COLOR_BAND_CONFIGS.neutral;
  return config.style.borderColor;
}

function Swatch({ paletteKey }: { paletteKey: string }): ReactElement {
  return (
    <span
      className={`block ${SWATCH_SIZE} rounded-full`}
      style={{ backgroundColor: swatchColor(paletteKey) }}
    />
  );
}

function ColorPickerPopover({
  children,
  keys,
  onSelect,
}: {
  children: ReactElement;
  keys: string[];
  onSelect: (paletteKey: string) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="start">
        {keys.length === 0 ? (
          <p className="text-xs text-muted-foreground">No colors left</p>
        ) : (
          <div className="flex flex-wrap gap-2" role="listbox">
            {keys.map((paletteKey) => (
              <Button
                key={paletteKey}
                type="button"
                variant="outline"
                size="icon"
                role="option"
                className="size-auto rounded-full border-border/60 p-0.5"
                onClick={() => {
                  onSelect(paletteKey);
                  setOpen(false);
                }}
              >
                <Swatch paletteKey={paletteKey} />
              </Button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export interface ColorRangeEditorProps {
  colorRange: TableColumnColorRange;
  canEdit: boolean;
  disabled: boolean;
  errors: string[];
  t: (key: string, options?: Record<string, unknown>) => string;
  onEndChange: (endIndex: number, end: number) => void;
  onAddBand: (newPaletteKey: string) => void;
  onRemoveBand: (bandIndex: number) => void;
  onChangeBandColor: (bandIndex: number, newPaletteKey: string) => void;
}

export function ColorRangeEditor({
  colorRange,
  canEdit,
  disabled,
  errors,
  t,
  onEndChange,
  onAddBand,
  onRemoveBand,
  onChangeBandColor,
}: ColorRangeEditorProps): ReactElement {
  const { paletteKeys, ends } = parseColorRangeToEnds(colorRange);
  const starts = [0];
  for (let i = 0; i < ends.length; i++) starts.push(ends[i] + 1);
  const availableKeys = getAvailablePaletteKeys(paletteKeys);
  const canAdd =
    canEdit && !disabled && paletteKeys.length < TAILWIND_BASIC_PALETTE_KEYS.length && availableKeys.length > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-2">
        {canEdit && (
          <div className="flex shrink-0 items-center pt-1.5">
            <ColorPickerPopover
              keys={availableKeys}
              onSelect={(key) => onAddBand(key)}
            >
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={`${SWATCH_SIZE} shrink-0`}
                disabled={!canAdd}
                aria-label="Add band"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </ColorPickerPopover>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {paletteKeys.map((paletteKey, index) => {
            const isLast = index === paletteKeys.length - 1;
            const canRemove = canEdit && !disabled && paletteKeys.length > 1 && !isLast;
            const usedByOtherBands = paletteKeys.filter((_, i) => i !== index);
            const changeableKeys = TAILWIND_BASIC_PALETTE_KEYS.filter(
              (k) => !usedByOtherBands.includes(k),
            );

            return (
              <div
                key={`${paletteKey}-${index}`}
                className="grid grid-cols-[1.5rem_1.75rem_1fr] items-center gap-x-2 gap-y-1 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 text-sm"
                role="group"
                aria-label={`Band ${paletteKey}`}
              >
                <div className="flex items-center justify-center">
                  {canRemove ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => onRemoveBand(index)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  ) : (
                    <span className="h-6 w-6 shrink-0" aria-hidden />
                  )}
                </div>
                {canEdit ? (
                  <ColorPickerPopover
                    keys={changeableKeys}
                    onSelect={(key) => onChangeBandColor(index, key)}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      className={`block shrink-0 ${SWATCH_SIZE} rounded-full p-0 hover:bg-transparent`}
                      style={{ backgroundColor: swatchColor(paletteKey) }}
                    />
                  </ColorPickerPopover>
                ) : (
                  <span
                    className={`block shrink-0 ${SWATCH_SIZE} rounded-full`}
                    style={{ backgroundColor: swatchColor(paletteKey) }}
                  />
                )}
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="shrink-0 text-xs text-muted-foreground">Start</span>
                  <span className="w-8 shrink-0 text-center text-xs tabular-nums">
                    {starts[index]}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">End</span>
                  {isLast ? (
                    <span className="w-8 shrink-0 text-center text-xs tabular-nums">100</span>
                  ) : (
                    <Input
                      key={`${paletteKey}-${ends[index]}`}
                      type="text"
                      inputMode="numeric"
                      defaultValue={String(ends[index] ?? "")}
                      disabled={disabled || !canEdit}
                      onBlur={(e) => {
                        if (!canEdit) return;
                        const parsed = Number.parseInt(e.target.value.replace(/\D/g, ""), 10);
                        if (!Number.isNaN(parsed)) onEndChange(index, parsed);
                      }}
                      aria-label={`End ${paletteKey}`}
                      className="h-7 w-16 shrink-0 tabular-nums"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {errors.length > 0 && (
        <ul className="text-destructive text-xs list-disc pl-4" role="alert">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
