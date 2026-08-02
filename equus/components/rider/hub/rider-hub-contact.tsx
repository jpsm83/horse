/**
 * RiderHubContact — rider contact (email / phone) shown on the public hub.
 * Contact lives on the entity, not User.preferences. Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { RiderViewDto } from "@/lib/services/riderService.ts";

export function RiderHubContact({ rider }: { rider: RiderViewDto }) {
  const t = useTranslations("rider.hub");

  return (
    <div className="space-y-2 text-sm">
      {rider.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{rider.email}</span>
        </p>
      ) : null}
      {rider.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{rider.phoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
