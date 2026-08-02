/**
 * CoachHubAbout — coach disciplines and competition levels shown on the public
 * hub. Pure presentational; renders chips for the arrays when present.
 *
 * Labels come from both the `coach.hub` (`disciplines`) and `coach.profile`
 * (`competitionLevels`) namespaces via the root `coach` namespace.
 */

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge.tsx";
import type { CoachViewDto } from "@/lib/services/coachService.ts";

export function CoachHubAbout({ coach }: { coach: CoachViewDto }) {
  const t = useTranslations("coach");

  return (
    <div className="space-y-4">
      {coach.disciplines?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("hub.disciplines")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {coach.disciplines.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {coach.competitionLevels?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">
            {t("profile.competitionLevels")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {coach.competitionLevels.map((item) => (
              <Badge key={item} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
