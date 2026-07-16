"use client";

/**
 * Circular flag icons (`country-flag-icons`). Use ISO alpha-2 codes everywhere,
 * including locale flags via `localeToFlagCode`.
 */

import * as React from "react";
import * as FlagIcons from "country-flag-icons/react/1x1";

import { cn } from "@/lib/utils";

type FlagIconProps = {
  className?: string;
  title?: string;
  preserveAspectRatio?: string;
  "aria-hidden"?: boolean | "true" | "false";
  focusable?: "false" | "true" | boolean;
};

export function FlagIcon({
  code,
  sizeClass = "h-4 w-4",
  withBorder = true,
  title,
  className,
}: {
  code: string;
  sizeClass?: string;
  withBorder?: boolean;
  title?: string;
  className?: string;
}) {
  const FlagComponent = FlagIcons[code as keyof typeof FlagIcons] as
    | React.ComponentType<FlagIconProps>
    | undefined;

  if (!FlagComponent) {
    return null;
  }

  return (
    <span
      title={title}
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden rounded-full",
        withBorder && "border border-border shadow-sm",
        sizeClass,
        className,
      )}
      aria-hidden={title ? undefined : true}
    >
      <FlagComponent
        title={title}
        aria-hidden
        focusable="false"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 block size-full max-h-none max-w-none"
      />
    </span>
  );
}

/** @deprecated Use `FlagIcon` */
export const CountryFlag = FlagIcon;
