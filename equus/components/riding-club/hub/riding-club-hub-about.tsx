/**
 * RidingClubHubAbout — riding club disciplines and facilities shown on the
 * public hub, plus an open-to-new-members notice. Pure presentational; renders
 * chips for the arrays when present.
 */

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge.tsx";
import type { RidingClubViewDto } from "@/lib/services/ridingClubService.ts";

export function RidingClubHubAbout({ ridingClub }: { ridingClub: RidingClubViewDto }) {
  const t = useTranslations("ridingClub.hub");
  const tAdmin = useTranslations("ridingClub.admin");

  return (
    <div className="space-y-4">
      {ridingClub.disciplines?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("disciplines")}</p>
          <div className="flex flex-wrap gap-1.5">
            {ridingClub.disciplines.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {ridingClub.facilities?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("facilities")}</p>
          <div className="flex flex-wrap gap-1.5">
            {ridingClub.facilities.map((item) => (
              <Badge key={item} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {ridingClub.acceptsNewMembers ? (
        <p className="text-sm text-success">{tAdmin("acceptsNewMembers")}</p>
      ) : null}
    </div>
  );
}
