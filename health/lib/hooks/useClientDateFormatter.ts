"use client";

import { useState, useEffect } from "react";

/**
 * Hook to format dates client-side only to prevent hydration mismatches
 * Returns empty string during SSR, formatted date after mount
 */
export function useClientDateFormatter(
  date: Date | string | undefined,
  locale: string = "en-US",
  options?: Intl.DateTimeFormatOptions
): string {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    if (!date) {
      setFormatted("");
      return;
    }
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      setFormatted("");
      return;
    }
    setFormatted(
      dateObj.toLocaleDateString(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        ...options,
      })
    );
  }, [date, locale, options]);

  return formatted;
}

