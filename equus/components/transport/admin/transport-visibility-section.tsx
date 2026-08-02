/**
 * TransportVisibilitySection — discovery toggles (`isPublic`, `acceptsNewBookings`)
 * for the Transport Admin tab. Persists via `PATCH /api/v1/transports/:id/discovery`
 * through the shared `SectionVisibilityControl` pattern (immediate autosave).
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateTransportDiscovery } from "@/hooks/queries/useTransportDiscovery.ts";
import type { TransportViewDto } from "@/lib/services/transportService.ts";

export function TransportVisibilitySection({
  transport,
}: {
  transport: TransportViewDto;
}) {
  const t = useTranslations("transport.admin");
  const toast = useAppToast();
  const updateDiscovery = useUpdateTransportDiscovery(transport.id);
  const [isPublic, setIsPublic] = useState(transport.isPublic !== false);
  const [acceptsNewBookings, setAcceptsNewBookings] = useState(
    transport.acceptsNewBookings !== false,
  );

  async function handleToggle(key: "isPublic" | "acceptsNewBookings", checked: boolean) {
    const optimistic =
      key === "isPublic" ? { isPublic: checked } : { acceptsNewBookings: checked };
    if (key === "isPublic") setIsPublic(checked);
    else setAcceptsNewBookings(checked);

    try {
      await updateDiscovery.mutateAsync(optimistic);
      toast.success(t("saved"));
    } catch {
      if (key === "isPublic") setIsPublic(!checked);
      else setAcceptsNewBookings(!checked);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="transport-isPublic" className="text-sm font-medium">
            {t("isPublic")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("isPublicDescription")}</p>
        </div>
        <Switch
          id="transport-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="transport-acceptsNewBookings" className="text-sm font-medium">
            {t("acceptsNewBookings")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("acceptsNewBookingsDescription")}</p>
        </div>
        <Switch
          id="transport-acceptsNewBookings"
          checked={acceptsNewBookings}
          onCheckedChange={(checked) => void handleToggle("acceptsNewBookings", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
