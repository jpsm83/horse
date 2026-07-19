"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SectionVisibilityPopover, type SectionVisibility } from "@/components/shared/section-visibility-popover.tsx";

type SectionProps = {
  title: string;
  description?: string;
  sectionKey?: string;
  visibility?: SectionVisibility;
  onVisibilityChange?: (visibility: SectionVisibility) => void;
  className?: string;
  children: ReactNode;
};

export function Section({
  title,
  description,
  sectionKey,
  visibility,
  onVisibilityChange,
  className,
  children,
}: SectionProps) {
  const showToggle = !!(sectionKey && visibility && onVisibilityChange);

  return (
    <section className={cn("flex min-h-0 flex-col gap-4 border border-primary/20 rounded-lg p-4 bg-primary/10", className)}>
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      {showToggle && (
        <SectionVisibilityPopover
          sectionKey={sectionKey}
          current={visibility}
          onChange={onVisibilityChange}
        />
      )}
      </div>
      {children}
    </section>
  );
}
