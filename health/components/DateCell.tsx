"use client";

import { useClientDateFormatter } from "@/lib/hooks/useClientDateFormatter";

interface DateCellProps {
  date: Date | string | undefined;
  locale?: string;
  className?: string;
}

/**
 * Client-side date cell component to prevent hydration mismatches
 * Formats dates only after component mounts on the client
 */
export default function DateCell({
  date,
  locale = "en-US",
  className = "",
}: DateCellProps) {
  const formattedDate = useClientDateFormatter(date, locale);

  return <span className={className}>{formattedDate || ""}</span>;
}

