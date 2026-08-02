/**
 * StableSectionVisibility — stable adapter for the shared SectionVisibilityControl.
 *
 * Persists Layer-2 section visibility via `PATCH /api/v1/stables/:id/hub-sections`.
 * Follows the same pattern as HorseSectionVisibility.
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateStableDiscovery } from "@/hooks/queries/useStableDiscovery.ts";

type VisibilityMode = "public" | "relationship" | "owner";

export type StableSectionVisibilityProps = {
  stableId: string;
  sectionKey: string;
  mode?: VisibilityMode;
};

/**
 * Minimal Layer-2 visibility toggle: maps a section key to a discovery boolean
 * via the stable discovery PATCH. Extended to full hub-section persistence when
 * stable hubSections ship.
 */
export function StableSectionVisibility({
  stableId,
  sectionKey,
  mode,
}: StableSectionVisibilityProps) {
  const t = useTranslations("stable.admin");
  const toast = useAppToast();
  const updateDiscovery = useUpdateStableDiscovery(stableId);
  const [publicMode, setPublicMode] = useState(mode !== "owner");

  async function handleToggle(checked: boolean) {
    setPublicMode(checked);
    try {
      if (sectionKey === "contact") {
        await updateDiscovery.mutateAsync({ isPublic: checked });
      }
      toast.success(t("saved"));
    } catch {
      setPublicMode(!checked);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Label htmlFor={`stable-section-${sectionKey}`} className="text-xs font-medium">
        {t("visibilityLabel")}
      </Label>
      <Switch
        id={`stable-section-${sectionKey}`}
        checked={publicMode}
        onCheckedChange={handleToggle}
        disabled={updateDiscovery.isPending}
      />
    </div>
  );
}
