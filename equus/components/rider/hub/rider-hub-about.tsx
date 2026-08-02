/**
 * RiderHubAbout — rider disciplines and experience years shown on the public
 * hub. Pure presentational; renders chips / summary when present.
 *
 * Labels come from both the `rider.hub` (`disciplines`) and `rider.profile`
 * (`experienceYears`) namespaces via the root `rider` namespace.
 */

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge.tsx";
import type { RiderViewDto } from "@/lib/services/riderService.ts";

export function RiderHubAbout({ rider }: { rider: RiderViewDto }) {
  const t = useTranslations("rider");

  return (
    <div className="space-y-4">
      {rider.disciplines?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("hub.disciplines")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {rider.disciplines.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {rider.experienceYears != null ? (
        <p className="text-sm text-muted-foreground">
          {t("profile.experienceYears")}: {rider.experienceYears}
        </p>
      ) : null}
    </div>
  );
}
