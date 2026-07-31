/**
 * Section — reusable layout wrapper for page sections.
 *
 * Pure layout: no data fetching, no visibility PATCH. Pass an entity adapter
 * (e.g. HorseSectionVisibility) via `visibilityControl` when needed.
 * Use `headerActions` for actions opposite the title (e.g. Upload).
 * Use `titleAddon` for content immediately after the title with a left border
 * (same pattern as description — e.g. Connect Invite).
 */

"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
  title: string;
  description?: string;
  /** Content after the title, bordered like description (e.g. Invite button). */
  titleAddon?: ReactNode;
  /** Slot for SectionVisibilityControl / entity adapters. */
  visibilityControl?: ReactNode;
  /** Slot for actions opposite the title (e.g. Upload button). */
  headerActions?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Section({
  title,
  description,
  titleAddon,
  visibilityControl,
  headerActions,
  className,
  children,
}: SectionProps) {
  const hasHeaderEnd = Boolean(visibilityControl || headerActions);

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col gap-4 border border-border rounded-lg p-4 bg-card text-card-foreground",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-4 min-w-0">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {titleAddon ? (
              <div className="sm:border-l sm:border-border sm:pl-4 flex items-center">
                {titleAddon}
              </div>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {hasHeaderEnd ? (
          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            {visibilityControl}
          </div>
        ) : null}
      </div>
      {children}

    </section>
  );
}
