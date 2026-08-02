/**
 * CoachVisibilitySection — discovery toggles (`isPublic`, `acceptsNewClients`)
 * for the Coach Profile tab. User-linked profiles have no Admin tab, so these
 * live on the profile. Persists via `PATCH /api/v1/coaches/:id/discovery`
 * (immediate autosave, optimistic with rollback on failure).
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateCoachDiscovery } from "@/hooks/queries/useCoachDiscovery.ts";
import type { CoachViewDto } from "@/lib/services/coachService.ts";

export function CoachVisibilitySection({ coach }: { coach: CoachViewDto }) {
  const t = useTranslations("coach.profile");
  const toast = useAppToast();
  const updateDiscovery = useUpdateCoachDiscovery(coach.id);
  const [isPublic, setIsPublic] = useState(coach.isPublic !== false);
  const [acceptsNewClients, setAcceptsNewClients] = useState(
    coach.acceptsNewClients !== false,
  );

  async function handleToggle(key: "isPublic" | "acceptsNewClients", checked: boolean) {
    const optimistic = { [key]: checked };
    const setter = key === "isPublic" ? setIsPublic : setAcceptsNewClients;
    setter(checked);

    try {
      await updateDiscovery.mutateAsync(optimistic);
      toast.success(t("saved"));
    } catch {
      setter(!checked);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="coach-isPublic" className="text-sm font-medium">
            {t("isPublic")}
          </Label>
        </div>
        <Switch
          id="coach-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="coach-acceptsNewClients" className="text-sm font-medium">
            {t("acceptsNewClients")}
          </Label>
        </div>
        <Switch
          id="coach-acceptsNewClients"
          checked={acceptsNewClients}
          onCheckedChange={(checked) => void handleToggle("acceptsNewClients", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
