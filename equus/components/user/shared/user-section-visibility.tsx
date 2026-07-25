/**
 * UserSectionVisibility — user adapter for shared SectionVisibilityControl.
 *
 * Persists via PATCH /api/v1/users/me/hub-sections (Layer-2).
 * Follows the same pattern as HorseSectionVisibility.
 */

"use client";

import { SectionVisibilityControl } from "@/components/shared/section-visibility-control.tsx";
import type { UserHubSectionKey } from "@/lib/users/userHubSections.ts";
import type { VisibilityMode } from "@/lib/visibility/sectionVisibility.ts";
import { useUpdateUserHubSection } from "@/hooks/queries/useCurrentUser.ts";

export type UserSectionVisibilityProps = {
  userId: string;
  sectionKey: UserHubSectionKey;
  mode: VisibilityMode;
};

export function UserSectionVisibility({
  userId,
  sectionKey,
  mode,
}: UserSectionVisibilityProps) {
  const updateHubSection = useUpdateUserHubSection(userId);

  return (
    <SectionVisibilityControl
      sectionKey={sectionKey}
      mode={mode}
      isPending={updateHubSection.isPending}
      persistMode={async (nextMode) => {
        await updateHubSection.mutateAsync({ sectionKey, mode: nextMode });
      }}
    />
  );
}
