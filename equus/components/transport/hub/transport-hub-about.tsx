/**
 * TransportHubAbout — transport specialties and service areas shown on the
 * public hub. Pure presentational; renders chips for the arrays when present.
 */

import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge.tsx";
import type { TransportViewDto } from "@/lib/services/transportService.ts";

export function TransportHubAbout({ transport }: { transport: TransportViewDto }) {
  const t = useTranslations("transport.hub");

  return (
    <div className="space-y-4">
      {transport.specialties?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("specialties")}</p>
          <div className="flex flex-wrap gap-1.5">
            {transport.specialties.map((item) => (
              <Badge key={item} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {transport.serviceAreas?.length ? (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{t("serviceAreas")}</p>
          <div className="flex flex-wrap gap-1.5">
            {transport.serviceAreas.map((item) => (
              <Badge key={item} variant="outline" className="text-xs">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {transport.acceptsNewBookings ? (
        <p className="text-sm text-success">{t("acceptsNewBookings")}</p>
      ) : null}
    </div>
  );
}
