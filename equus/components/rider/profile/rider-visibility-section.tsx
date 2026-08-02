/**
 * RiderVisibilitySection — discovery toggles (`isPublic`, `acceptsNewClients`)
 * for the Rider Profile tab. User-linked profiles have no Admin tab, so these
 * live on the profile. Persists via `PATCH /api/v1/riders/:id/discovery`
 * (immediate autosave, optimistic with rollback on failure).
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateRiderDiscovery } from "@/hooks/queries/useRiderDiscovery.ts";
import type { RiderViewDto } from "@/lib/services/riderService.ts";

export function RiderVisibilitySection({ rider }: { rider: RiderViewDto }) {
  const t = useTranslations("rider.profile");
  const toast = useAppToast();
  const updateDiscovery = useUpdateRiderDiscovery(rider.id);
  const [isPublic, setIsPublic] = useState(rider.isPublic !== false);
  const [acceptsNewClients, setAcceptsNewClients] = useState(
    rider.acceptsNewClients !== false,
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
          <Label htmlFor="rider-isPublic" className="text-sm font-medium">
            {t("isPublic")}
          </Label>
        </div>
        <Switch
          id="rider-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="rider-acceptsNewClients" className="text-sm font-medium">
            {t("acceptsNewClients")}
          </Label>
        </div>
        <Switch
          id="rider-acceptsNewClients"
          checked={acceptsNewClients}
          onCheckedChange={(checked) => void handleToggle("acceptsNewClients", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
