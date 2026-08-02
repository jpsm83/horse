/**
 * StableHubAbout — stable disciplines and services shown on the public hub.
 * Pure presentational; renders chips for the arrays when present.
 */

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge.tsx";
import type { StableViewDto } from "@/lib/services/stableService.ts";

export function StableHubAbout({ stable }: { stable: StableViewDto }) {
  const t = useTranslations("stable.hub");

  return (
    <div className="space-y-4">
      {stable.disciplines?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("disciplines")}</p>
          <div className="flex flex-wrap gap-1.5">
            {stable.disciplines.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {stable.services?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("services")}</p>
          <div className="flex flex-wrap gap-1.5">
            {stable.services.map((item) => (
              <Badge key={item} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {stable.acceptsNewHorses ? (
        <p className="text-sm text-success">{t("acceptsNewHorses")}</p>
      ) : null}
    </div>
  );
}
