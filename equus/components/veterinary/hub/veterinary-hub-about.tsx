/**
 * VeterinaryHubAbout — veterinary description and emergency availability shown
 * on the public hub. Pure presentational; receives the veterinary view DTO.
 */

import { useTranslations } from "next-intl";

import type { VeterinaryViewDto } from "@/lib/services/veterinaryService.ts";

export function VeterinaryHubAbout({ veterinary }: { veterinary: VeterinaryViewDto }) {
  const t = useTranslations("veterinary.hub");

  return (
    <div className="space-y-4">
      {veterinary.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{veterinary.description}</p>
      ) : null}

      {veterinary.emergencyAvailability ? (
        <p className="text-sm text-success">{t("emergencyAvailability")}</p>
      ) : null}
    </div>
  );
}
