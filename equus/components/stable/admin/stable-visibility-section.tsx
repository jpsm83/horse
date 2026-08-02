/**
 * StableVisibilitySection — discovery toggles (`isPublic`, `acceptsNewHorses`)
 * for the Stable Admin tab. Persists via `PATCH /api/v1/stables/:id/discovery`
 * through the shared `SectionVisibilityControl` pattern (immediate autosave).
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateStableDiscovery } from "@/hooks/queries/useStableDiscovery.ts";
import type { StableViewDto } from "@/lib/services/stableService.ts";

export function StableVisibilitySection({ stable }: { stable: StableViewDto }) {
  const t = useTranslations("stable.admin");
  const toast = useAppToast();
  const updateDiscovery = useUpdateStableDiscovery(stable.id);
  const [isPublic, setIsPublic] = useState(stable.isPublic !== false);
  const [acceptsNewHorses, setAcceptsNewHorses] = useState(stable.acceptsNewHorses !== false);

  async function handleToggle(key: "isPublic" | "acceptsNewHorses", checked: boolean) {
    const optimistic = key === "isPublic" ? { isPublic: checked } : { acceptsNewHorses: checked };
    if (key === "isPublic") setIsPublic(checked);
    else setAcceptsNewHorses(checked);

    try {
      await updateDiscovery.mutateAsync(optimistic);
      toast.success(t("saved"));
    } catch {
      if (key === "isPublic") setIsPublic(!checked);
      else setAcceptsNewHorses(!checked);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="stable-isPublic" className="text-sm font-medium">
            {t("isPublic")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("isPublicDescription")}</p>
        </div>
        <Switch
          id="stable-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="stable-acceptsNewHorses" className="text-sm font-medium">
            {t("acceptsNewHorses")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("acceptsNewHorsesDescription")}</p>
        </div>
        <Switch
          id="stable-acceptsNewHorses"
          checked={acceptsNewHorses}
          onCheckedChange={(checked) => void handleToggle("acceptsNewHorses", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
