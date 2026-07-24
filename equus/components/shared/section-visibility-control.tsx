/**
 * SectionVisibilityControl — single shared behavior for section visibility.
 *
 * Owns: no-op guard, persist call, success/error toasts, pending UI.
 * Entity adapters (e.g. HorseSectionVisibility) supply `persistMode`.
 */

"use client";

import { useTranslations } from "next-intl";

import { SectionVisibilityPopover } from "@/components/shared/section-visibility-popover.tsx";
import type {
  SectionVisibility,
  VisibilityMode,
} from "@/lib/visibility/sectionVisibility.ts";
import { useAppToast } from "@/hooks/use-app-toast.ts";

export type SectionVisibilityControlProps = {
  /** DOM / a11y id prefix for radio items. */
  sectionKey: string;
  /** Current persisted mode. */
  mode: VisibilityMode;
  /** Persist the new mode (entity adapter owns the PATCH). */
  persistMode: (mode: VisibilityMode) => Promise<void>;
  isPending?: boolean;
};

export function SectionVisibilityControl({
  sectionKey,
  mode,
  persistMode,
  isPending = false,
}: SectionVisibilityControlProps) {
  const t = useTranslations("visibility");
  const toast = useAppToast();

  async function handleChange(visibility: SectionVisibility) {
    if (visibility.mode === mode) return;
    try {
      await persistMode(visibility.mode);
      toast.success(t("saved"));
    } catch {
      toast.error(t("saveFailed"));
    }
  }

  return (
    <SectionVisibilityPopover
      sectionKey={sectionKey}
      current={{ mode }}
      onChange={(v) => void handleChange(v)}
      isPending={isPending}
    />
  );
}
