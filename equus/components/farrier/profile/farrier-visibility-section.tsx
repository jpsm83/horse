/**
 * FarrierVisibilitySection — discovery toggles (`isPublic`, `acceptsNewClients`)
 * on the Farrier Profile tab (farriers have no admin tab). Persists immediately
 * via `PATCH /api/v1/farriers/:id/discovery`.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateFarrierDiscovery } from "@/hooks/queries/useFarrierDiscovery.ts";
import type { FarrierViewDto } from "@/lib/services/farrierService.ts";

export function FarrierVisibilitySection({ farrier }: { farrier: FarrierViewDto }) {
  const t = useTranslations("farrier.profile");
  const toast = useAppToast();
  const updateDiscovery = useUpdateFarrierDiscovery(farrier.id);
  const [isPublic, setIsPublic] = useState(farrier.isPublic !== false);
  const [acceptsNewClients, setAcceptsNewClients] = useState(farrier.acceptsNewClients !== false);

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
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="farrier-isPublic" className="text-sm font-medium">
            {t("isPublic")}
          </Label>
        </div>
        <Switch
          id="farrier-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="farrier-acceptsNewClients" className="text-sm font-medium">
            {t("acceptsNewClients")}
          </Label>
        </div>
        <Switch
          id="farrier-acceptsNewClients"
          checked={acceptsNewClients}
          onCheckedChange={(checked) => void handleToggle("acceptsNewClients", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
