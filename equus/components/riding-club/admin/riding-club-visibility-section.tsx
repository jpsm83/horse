/**
 * RidingClubVisibilitySection — discovery toggles (`isPublic`,
 * `acceptsNewMembers`) for the Riding Club Admin tab. Persists via
 * `PATCH /api/v1/riding-clubs/:id/discovery` through the shared
 * `SectionVisibilityControl` pattern (immediate autosave).
 */

"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Label } from "@/components/ui/label.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateRidingClubDiscovery } from "@/hooks/queries/useRidingClubDiscovery.ts";
import type { RidingClubViewDto } from "@/lib/services/ridingClubService.ts";

export function RidingClubVisibilitySection({ ridingClub }: { ridingClub: RidingClubViewDto }) {
  const t = useTranslations("ridingClub.admin");
  const toast = useAppToast();
  const updateDiscovery = useUpdateRidingClubDiscovery(ridingClub.id);
  const [isPublic, setIsPublic] = useState(ridingClub.isPublic !== false);
  const [acceptsNewMembers, setAcceptsNewMembers] = useState(
    ridingClub.acceptsNewMembers !== false,
  );

  async function handleToggle(
    key: "isPublic" | "acceptsNewMembers",
    checked: boolean,
  ) {
    const optimistic =
      key === "isPublic" ? { isPublic: checked } : { acceptsNewMembers: checked };
    if (key === "isPublic") setIsPublic(checked);
    else setAcceptsNewMembers(checked);

    try {
      await updateDiscovery.mutateAsync(optimistic);
      toast.success(t("saved"));
    } catch {
      if (key === "isPublic") setIsPublic(!checked);
      else setAcceptsNewMembers(!checked);
      toast.error(t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="riding-club-isPublic" className="text-sm font-medium">
            {t("isPublic")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("isPublicDescription")}</p>
        </div>
        <Switch
          id="riding-club-isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => void handleToggle("isPublic", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="riding-club-acceptsNewMembers" className="text-sm font-medium">
            {t("acceptsNewMembers")}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t("acceptsNewMembersDescription")}
          </p>
        </div>
        <Switch
          id="riding-club-acceptsNewMembers"
          checked={acceptsNewMembers}
          onCheckedChange={(checked) => void handleToggle("acceptsNewMembers", checked)}
          disabled={updateDiscovery.isPending}
        />
      </div>
    </div>
  );
}
