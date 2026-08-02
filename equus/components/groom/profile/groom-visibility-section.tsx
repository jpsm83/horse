/**
 * GroomVisibilitySection — discovery toggles (`isPublic`, `acceptsNewClients`)
 * on the Groom Profile tab (grooms have no admin tab). Persists immediately via
 * `PATCH /api/v1/grooms/:id/discovery`.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateGroomDiscovery } from "@/hooks/queries/useGroomDiscovery.ts";
import type { GroomViewDto } from "@/lib/services/groomService.ts";

export function GroomVisibilitySection({ groom }: { groom: GroomViewDto }) {
  const t = useTranslations("groom.profile");
  const toast = useAppToast();
  const updateDiscovery = useUpdateGroomDiscovery(groom.id);
  const [isPublic, setIsPublic] = useState(groom.isPublic !== false);
  const [acceptsNewClients, setAcceptsNewClients] = useState(groom.acceptsNewClients !== false);

  async function handleToggle(key: "isPublic" | "acceptsNewClients", checked: boolean) {
    const optimistic = key === "isPublic" ? { isPublic: checked } : { acceptsNewClients: checked };
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
          <Label htmlFor="groom-isPublic" className="text-sm font-medium">
            {t("isPublic")}
          </Label>
        </div>
        <Switch
          id="groom-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="groom-acceptsNewClients" className="text-sm font-medium">
            {t("acceptsNewClients")}
          </Label>
        </div>
        <Switch
          id="groom-acceptsNewClients"
          checked={acceptsNewClients}
          onCheckedChange={(checked) => void handleToggle("acceptsNewClients", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
