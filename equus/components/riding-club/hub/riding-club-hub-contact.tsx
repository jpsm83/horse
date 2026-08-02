/**
 * RidingClubHubContact — riding club business contact (email / phone) shown on
 * the public hub. Contact lives on the entity, not User.preferences.
 * Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { RidingClubViewDto } from "@/lib/services/ridingClubService.ts";

export function RidingClubHubContact({ ridingClub }: { ridingClub: RidingClubViewDto }) {
  const t = useTranslations("ridingClub.hub");

  return (
    <div className="space-y-2 text-sm">
      {ridingClub.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{ridingClub.email}</span>
        </p>
      ) : null}
      {ridingClub.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{ridingClub.phoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
