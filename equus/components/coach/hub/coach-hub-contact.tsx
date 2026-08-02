/**
 * CoachHubContact — coach contact (email / phone) shown on the public hub.
 * Contact lives on the entity, not User.preferences. Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { CoachViewDto } from "@/lib/services/coachService.ts";

export function CoachHubContact({ coach }: { coach: CoachViewDto }) {
  const t = useTranslations("coach.hub");

  return (
    <div className="space-y-2 text-sm">
      {coach.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{coach.email}</span>
        </p>
      ) : null}
      {coach.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{coach.phoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
