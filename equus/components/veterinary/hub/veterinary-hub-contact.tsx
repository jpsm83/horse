/**
 * VeterinaryHubContact — veterinary business contact (email / phone / emergency
 * phone) shown on the public hub. Contact lives on the entity, not
 * User.preferences. Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { VeterinaryViewDto } from "@/lib/services/veterinaryService.ts";

export function VeterinaryHubContact({ veterinary }: { veterinary: VeterinaryViewDto }) {
  const t = useTranslations("veterinary.hub");

  return (
    <div className="space-y-2 text-sm">
      {veterinary.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{veterinary.email}</span>
        </p>
      ) : null}
      {veterinary.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{veterinary.phoneNumber}</span>
        </p>
      ) : null}
      {veterinary.emergencyPhoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("emergencyPhone")}: </span>
          <span>{veterinary.emergencyPhoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
