/**
 * Section — reusable layout wrapper for page sections.
 *
 * Pure layout: no data fetching, no visibility PATCH. Pass an entity adapter
 * (e.g. HorseSectionVisibility) via `visibilityControl` when needed.
 */

"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
  title: string;
  description?: string;
  /** Slot for SectionVisibilityControl / entity adapters. */
  visibilityControl?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Section({
  title,
  description,
  visibilityControl,
  className,
  children,
}: SectionProps) {
  return (
    <section
      className={cn(
        "flex min-h-0 flex-col gap-4 border border-border rounded-lg p-4 bg-card text-card-foreground",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground sm:border-l sm:border-border sm:pl-4">
              {description}
            </p>
          )}
        </div>
        {visibilityControl}
      </div>
      {children}
    </section>
  );
}
