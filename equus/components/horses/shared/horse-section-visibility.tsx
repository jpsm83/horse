/**
 * HorseSectionVisibility — horse adapter for shared SectionVisibilityControl.
 *
 * Persists via PATCH /api/v1/horses/:id/hub-sections (Layer-2).
 * Reuse pattern for other entities: new *SectionVisibility adapter + entity PATCH.
 */

"use client";

import { SectionVisibilityControl } from "@/components/shared/section-visibility-control.tsx";
import type { HubSectionKey } from "@/lib/horses/hubSections.ts";
import type { VisibilityMode } from "@/lib/visibility/sectionVisibility.ts";
import { useUpdateHorseHubSection } from "@/hooks/queries/useHorse.ts";

export type HorseSectionVisibilityProps = {
  horseId: string;
  sectionKey: HubSectionKey;
  mode: VisibilityMode;
  /** Optional DOM id prefix; defaults to sectionKey. */
  uiSectionKey?: string;
};

export function HorseSectionVisibility({
  horseId,
  sectionKey,
  mode,
  uiSectionKey,
}: HorseSectionVisibilityProps) {
  const updateHubSection = useUpdateHorseHubSection();

  return (
    <SectionVisibilityControl
      sectionKey={uiSectionKey ?? sectionKey}
      mode={mode}
      isPending={updateHubSection.isPending}
      persistMode={async (nextMode) => {
        await updateHubSection.mutateAsync({
          horseId,
          sectionKey,
          mode: nextMode,
        });
      }}
    />
  );
}
