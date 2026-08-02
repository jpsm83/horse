/**
 * BreederVisibilitySection — discovery toggle (`isPublic`) for the Breeder
 * Admin tab. Persists via `PATCH /api/v1/breeders/:id/discovery` through the
 * shared `SectionVisibilityControl` pattern (immediate autosave).
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateBreederDiscovery } from "@/hooks/queries/useBreederDiscovery.ts";
import type { BreederViewDto } from "@/lib/services/breederService.ts";

export function BreederVisibilitySection({ breeder }: { breeder: BreederViewDto }) {
  const t = useTranslations("breeder.admin");
  const toast = useAppToast();
  const updateDiscovery = useUpdateBreederDiscovery(breeder.id);
  const [isPublic, setIsPublic] = useState(breeder.isPublic !== false);

  async function handleToggle(key: "isPublic", checked: boolean) {
    const optimistic = { isPublic: checked };
    setIsPublic(checked);

    try {
      await updateDiscovery.mutateAsync(optimistic);
      toast.success(t("saved"));
    } catch {
      setIsPublic(!checked);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="breeder-isPublic" className="text-sm font-medium">
            {t("isPublic")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("isPublicDescription")}</p>
        </div>
        <Switch
          id="breeder-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
