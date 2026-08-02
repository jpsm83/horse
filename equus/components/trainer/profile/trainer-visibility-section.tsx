/**
 * TrainerVisibilitySection — discovery toggles (`isPublic`, `acceptsNewClients`)
 * for the Trainer Profile tab (user-linked profiles have no admin tab).
 * Persists via `PATCH /api/v1/trainers/:id/discovery` (immediate autosave).
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateTrainerDiscovery } from "@/hooks/queries/useTrainerDiscovery.ts";
import type { TrainerViewDto } from "@/lib/services/trainerService.ts";

export function TrainerVisibilitySection({ trainer }: { trainer: TrainerViewDto }) {
  const t = useTranslations("trainer.profile");
  const toast = useAppToast();
  const updateDiscovery = useUpdateTrainerDiscovery(trainer.id);
  const [isPublic, setIsPublic] = useState(trainer.isPublic !== false);
  const [acceptsNewClients, setAcceptsNewClients] = useState(
    trainer.acceptsNewClients !== false,
  );

  async function handleToggle(key: "isPublic" | "acceptsNewClients", checked: boolean) {
    const optimistic =
      key === "isPublic" ? { isPublic: checked } : { acceptsNewClients: checked };
    if (key === "isPublic") setIsPublic(checked);
    else setAcceptsNewClients(checked);

    try {
      await updateDiscovery.mutateAsync(optimistic);
      toast.success(t("saved"));
    } catch {
      if (key === "isPublic") setIsPublic(!checked);
      else setAcceptsNewClients(!checked);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="trainer-isPublic" className="text-sm font-medium">
          {t("isPublic")}
        </Label>
        <Switch
          id="trainer-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="trainer-acceptsNewClients" className="text-sm font-medium">
          {t("acceptsNewClients")}
        </Label>
        <Switch
          id="trainer-acceptsNewClients"
          checked={acceptsNewClients}
          onCheckedChange={(checked) => void handleToggle("acceptsNewClients", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
