/**
 * GroomHubAbout — groom specialties shown on the public hub.
 * Pure presentational; renders chips for the array when present.
 */

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge.tsx";
import type { GroomViewDto } from "@/lib/services/groomService.ts";

export function GroomHubAbout({ groom }: { groom: GroomViewDto }) {
  const t = useTranslations("groom.hub");

  return (
    <div className="space-y-4">
      {groom.specialties?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("specialties")}</p>
          <div className="flex flex-wrap gap-1.5">
            {groom.specialties.map((item) => (
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
