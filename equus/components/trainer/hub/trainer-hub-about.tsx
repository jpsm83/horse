/**
 * TrainerHubAbout — trainer specialties shown on the public hub. Pure
 * presentational; renders chips for the array when present.
 */

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge.tsx";
import type { TrainerViewDto } from "@/lib/services/trainerService.ts";

export function TrainerHubAbout({ trainer }: { trainer: TrainerViewDto }) {
  const t = useTranslations("trainer.hub");

  return (
    <div className="space-y-4">
      {trainer.specialties?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("specialties")}</p>
          <div className="flex flex-wrap gap-1.5">
            {trainer.specialties.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
