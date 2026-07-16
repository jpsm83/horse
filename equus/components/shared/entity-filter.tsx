"use client";

import { Search, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FlagIcon } from "@/components/shared/country-flag.tsx";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";

export type FilterFieldConfig = {
  key: string;
  label: string;
  type: "text" | "select" | "toggle" | "range" | "flag-select";
  options?: { value: string; label: string; flagCode?: string }[];
  rangeMin?: number;
  rangeMax?: number;
  rangeStep?: number;
  placeholder?: string;
};

export type EntityFilterProps = {
  fields: FilterFieldConfig[];
  onSearch: (params: URLSearchParams) => void;
  createHref?: string;
  createLabel?: string;
};

export function EntityFilter({ fields, onSearch, createHref, createLabel }: EntityFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAppAuth();

  function initialValue(field: FilterFieldConfig): string {
    if (field.type === "range") return "";
    return searchParams.get(field.key) ?? "";
  }

  function initialRange(field: FilterFieldConfig): [number, number] {
    const min = Number(searchParams.get(`${field.key}Min`));
    const max = Number(searchParams.get(`${field.key}Max`));
    return [
      !Number.isNaN(min) ? min : (field.rangeMin ?? 0),
      !Number.isNaN(max) ? max : (field.rangeMax ?? 100),
    ];
  }

  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== "range") {
        initial[field.key] = initialValue(field);
      }
    }
    return initial;
  });

  const [ranges, setRanges] = useState<Record<string, [number, number]>>(() => {
    const initial: Record<string, [number, number]> = {};
    for (const field of fields) {
      if (field.type === "range") {
        initial[field.key] = initialRange(field);
      }
    }
    return initial;
  });

  const updateValue = useCallback((key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateRange = useCallback((key: string, value: [number, number]) => {
    setRanges((prev) => ({ ...prev, [key]: value }));
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    for (const field of fields) {
      if (field.type === "range") {
        const range = ranges[field.key];
        if (range) {
          const [min, max] = range;
          if (min !== (field.rangeMin ?? 0)) {
            params.set(`${field.key}Min`, String(min));
          }
          if (max !== (field.rangeMax ?? 100)) {
            params.set(`${field.key}Max`, String(max));
          }
        }
      } else {
        const val = values[field.key]?.trim();
        if (val) {
          params.set(field.key, val);
        }
      }
    }
    onSearch(params);
  }

  function handleClear() {
    const empty: Record<string, string> = {};
    for (const field of fields) {
      if (field.type !== "range") empty[field.key] = "";
    }
    setValues(empty);
    const defaultRanges: Record<string, [number, number]> = {};
    for (const field of fields) {
      if (field.type === "range") {
        defaultRanges[field.key] = [field.rangeMin ?? 0, field.rangeMax ?? 100];
      }
    }
    setRanges(defaultRanges);
    onSearch(new URLSearchParams());
  }

  const hasActiveFilters = useMemo(() => {
    for (const field of fields) {
      if (field.type === "range") {
        const range = ranges[field.key];
        if (range && (range[0] !== (field.rangeMin ?? 0) || range[1] !== (field.rangeMax ?? 100))) {
          return true;
        }
      } else {
        if (values[field.key]?.trim()) return true;
      }
    }
    return false;
  }, [fields, values, ranges]);

  return (
    <div className="flex flex-wrap items-center sm-gap-3 gap-6">
      {fields.map((field) => {
        if (field.type === "flag-select") {
          const opts = field.options ?? [];
          const selectedValue = values[field.key] ?? "";
          const selected = opts.find((o) => o.value === selectedValue);
          return (
            <div key={field.key} className="min-w-36 flex-1 space-y-1">
              <label className="text-xs font-medium text-foreground">{field.label}</label>
              <Select
                value={selectedValue || null}
                onValueChange={(v) => updateValue(field.key, v ?? "")}
              >
                <SelectTrigger className="h-8 w-full">
                  {selected ? (
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <FlagIcon code={selected.flagCode ?? selected.value} sizeClass="h-4 w-4" />
                      <span className="truncate">{selected.label}</span>
                    </span>
                  ) : (
                    <SelectValue placeholder={field.placeholder} />
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-60" side="bottom" align="start" alignItemWithTrigger={false}>
                  {opts.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <span className="flex min-w-0 items-center gap-2">
                        <FlagIcon code={opt.flagCode ?? opt.value} sizeClass="h-4 w-4" />
                        <span>{opt.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (field.type === "text") {
          return (
            <div key={field.key} className="min-w-32 flex-1 space-y-1">
              <label className="text-xs font-medium text-foreground">{field.label}</label>
              <Input
                value={values[field.key] ?? ""}
                onChange={(e) => updateValue(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="h-8"
              />
            </div>
          );
        }

        if (field.type === "select") {
          const opts = field.options ?? [];
          const selectedValue = values[field.key] ?? "";
          return (
            <div key={field.key} className="min-w-36 flex-1 space-y-1">
              <label className="text-xs font-medium text-foreground">{field.label}</label>
              <Select
                value={selectedValue || null}
                onValueChange={(v) => updateValue(field.key, v ?? "")}
              >
                <SelectTrigger className="h-8 w-full">
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-60" side="bottom" align="start" alignItemWithTrigger={false}>
                  {opts.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (field.type === "toggle") {
          const checked = values[field.key] === "true";
          return (
            <div key={field.key} className="flex items-center gap-2 mt-5">
              <Checkbox
                id={`filter-${field.key}`}
                checked={checked}
                onCheckedChange={(c) => updateValue(field.key, c ? "true" : "")}
              />
              <label
                htmlFor={`filter-${field.key}`}
                className="cursor-pointer text-lg font-medium"
              >
                {field.label}
              </label>
            </div>
          );
        }

        if (field.type === "range") {
          const range = ranges[field.key] ?? [field.rangeMin ?? 0, field.rangeMax ?? 100];
          return (
            <div key={field.key} className="min-w-48 flex-1 space-y-1">
              <label className="text-xs font-medium text-foreground">
                {field.label}: {range[0]} – {range[1]}
              </label>
              <Slider
                value={range}
                onValueChange={(v) => updateRange(field.key, v as [number, number])}
                min={field.rangeMin ?? 0}
                max={field.rangeMax ?? 100}
                step={field.rangeStep ?? 1}
              />
            </div>
          );
        }

        return null;
      })}

      <div className="flex items-center sm-gap-3 gap-6 mt-5">
        {hasActiveFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            <X className="size-3.5" aria-hidden />
            Clear
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={handleSearch}>
          <Search className="size-3.5" aria-hidden />
          Search
        </Button>

      {createHref ? (
        <Button
        size="sm"
        onClick={() => {
          if (isAuthenticated) {
            router.push(createHref);
          } else {
            router.push(buildSignInPath(createHref));
          }
        }}
        >
            {createLabel ?? createHref}
          </Button>
      ) : null}
    </div>
      </div>
  );
}
