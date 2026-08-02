/**
 * FarrierHubContact — farrier business contact (email / phone) shown on the
 * public hub. Contact lives on the entity, not User.preferences.
 * Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { FarrierViewDto } from "@/lib/services/farrierService.ts";

export function FarrierHubContact({ farrier }: { farrier: FarrierViewDto }) {
  const t = useTranslations("farrier.hub");

  return (
    <div className="space-y-2 text-sm">
      {farrier.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{farrier.email}</span>
        </p>
      ) : null}
      {farrier.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{farrier.phoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
