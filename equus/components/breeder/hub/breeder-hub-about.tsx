/**
 * BreederHubAbout — breeder disciplines and bloodlines shown on the public hub.
 * Pure presentational; renders chips for the arrays when present.
 */

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge.tsx";
import type { BreederViewDto } from "@/lib/services/breederService.ts";

export function BreederHubAbout({ breeder }: { breeder: BreederViewDto }) {
  const t = useTranslations("breeder.hub");

  return (
    <div className="space-y-4">
      {breeder.disciplines?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("disciplines")}</p>
          <div className="flex flex-wrap gap-1.5">
            {breeder.disciplines.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {breeder.bloodlines?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("bloodlines")}</p>
          <div className="flex flex-wrap gap-1.5">
            {breeder.bloodlines.map((item) => (
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
