/**
 * VeterinaryVisibilitySection — discovery toggles (`isPublic`,
 * `acceptsNewPatients`) for the Veterinary Profile tab (user-linked profiles
 * have no admin tab). Persists via `PATCH /api/v1/veterinaries/:id/discovery`
 * (immediate autosave).
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateVeterinaryDiscovery } from "@/hooks/queries/useVeterinaryDiscovery.ts";
import type { VeterinaryViewDto } from "@/lib/services/veterinaryService.ts";

export function VeterinaryVisibilitySection({
  veterinary,
}: {
  veterinary: VeterinaryViewDto;
}) {
  const t = useTranslations("veterinary.profile");
  const toast = useAppToast();
  const updateDiscovery = useUpdateVeterinaryDiscovery(veterinary.id);
  const [isPublic, setIsPublic] = useState(veterinary.isPublic !== false);
  const [acceptsNewPatients, setAcceptsNewPatients] = useState(
    veterinary.acceptsNewPatients !== false,
  );

  async function handleToggle(key: "isPublic" | "acceptsNewPatients", checked: boolean) {
    const optimistic =
      key === "isPublic" ? { isPublic: checked } : { acceptsNewPatients: checked };
    if (key === "isPublic") setIsPublic(checked);
    else setAcceptsNewPatients(checked);

    try {
      await updateDiscovery.mutateAsync(optimistic);
      toast.success(t("saved"));
    } catch {
      if (key === "isPublic") setIsPublic(!checked);
      else setAcceptsNewPatients(!checked);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="veterinary-isPublic" className="text-sm font-medium">
          {t("isPublic")}
        </Label>
        <Switch
          id="veterinary-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="veterinary-acceptsNewPatients" className="text-sm font-medium">
          {t("acceptsNewPatients")}
        </Label>
        <Switch
          id="veterinary-acceptsNewPatients"
          checked={acceptsNewPatients}
          onCheckedChange={(checked) => void handleToggle("acceptsNewPatients", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
