"use client";

import { useState, useEffect } from "react";

interface ClientDateProps {
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
  className?: string;
}

/**
 * Client-side date formatter to prevent hydration mismatches
 * Only renders the formatted date after component mounts on the client
 */
export default function ClientDate({
  locale = "en-US",
  options = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  },
  className,
}: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const date = new Date();
    setFormattedDate(date.toLocaleDateString(locale, options));
  }, [locale, options]);

  // Return empty during SSR to prevent hydration mismatch
  if (!formattedDate) {
    return <span className={className} aria-label="Loading date" />;
  }

  return <span className={className}>{formattedDate}</span>;
}

