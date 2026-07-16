"use client";

import type { ReactElement } from "react";
import { FlagIcon } from "@/components/shared/country-flag.tsx";

import { countryCodeFromCellValue } from "./utils";

interface FlagCellProps {
  value: unknown;
  emptyLabel: string;
  resolveCountryCode?: (value: string) => string | null;
  align?: "start" | "center";
}

export function FlagCell({
  value,
  emptyLabel,
  resolveCountryCode,
  align = "center",
}: FlagCellProps): ReactElement {
  const text = value == null || value === "" ? "" : String(value).trim();
  if (!text) return <span>{emptyLabel}</span>;

  const countryCode = (resolveCountryCode ?? countryCodeFromCellValue)(text);

  return (
    <div
      className={
        align === "start"
          ? "flex items-center gap-2 justify-start min-w-0"
          : "flex justify-center items-center gap-2"
      }
    >
      {countryCode ? (
        <FlagIcon code={countryCode} sizeClass="h-4 w-4" withBorder />
      ) : null}
      <span>{text}</span>
    </div>
  );
}
