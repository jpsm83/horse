"use client";

import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { InlineErrorFallback } from "@/components/errors/inline-error-fallback.tsx";
import { SectionVisibilityPopover, type SectionVisibility } from "@/components/shared/section-visibility-popover.tsx";

type SectionProps = {
  title: string;
  description?: string;
  sectionKey?: string;
  visibility?: SectionVisibility;
  onVisibilityChange?: (visibility: SectionVisibility) => void;
  errorBoundary?: boolean;
  className?: string;
  children: ReactNode;
};

export function Section({
  title,
  description,
  sectionKey,
  visibility,
  onVisibilityChange,
  errorBoundary = true,
  className,
  children,
}: SectionProps) {
  const showToggle = !!(sectionKey && visibility && onVisibilityChange);

  return (
    <section className={cn("flex min-h-0 flex-col gap-4", className)}>
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
      {errorBoundary ? (
        <ErrorBoundary fallbackRender={(p) => <InlineErrorFallback {...p} />}>
          {children}
        </ErrorBoundary>
      ) : (
        children
      )}
    </section>
  );
}
