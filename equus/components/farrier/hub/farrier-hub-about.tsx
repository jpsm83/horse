/**
 * FarrierHubAbout — farrier experience and service area shown on the public
 * hub. Pure presentational; `experienceYears` / `serviceAreaKm` labels come from
 * the `farrier.profile` namespace (the hub namespace has no numeric labels).
 */

import { useTranslations } from "next-intl";

import type { FarrierViewDto } from "@/lib/services/farrierService.ts";

export function FarrierHubAbout({ farrier }: { farrier: FarrierViewDto }) {
  const t = useTranslations("farrier");

  return (
    <div className="space-y-2 text-sm">
      {farrier.experienceYears != null ? (
        <p>
          <span className="text-muted-foreground">{t("profile.experienceYears")}: </span>
          <span>{farrier.experienceYears}</span>
        </p>
      ) : null}
      {farrier.serviceAreaKm != null ? (
        <p>
          <span className="text-muted-foreground">{t("profile.serviceAreaKm")}: </span>
          <span>{farrier.serviceAreaKm}</span>
        </p>
      ) : null}
    </div>
  );
}
