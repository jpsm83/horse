/**
 * GroomHubContact — groom business contact (email / phone) shown on the public
 * hub. Contact lives on the entity, not User.preferences. Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { GroomViewDto } from "@/lib/services/groomService.ts";

export function GroomHubContact({ groom }: { groom: GroomViewDto }) {
  const t = useTranslations("groom.hub");

  return (
    <div className="space-y-2 text-sm">
      {groom.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{groom.email}</span>
        </p>
      ) : null}
      {groom.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{groom.phoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
