/**
 * BreederHubContact — breeder business contact (email / phone) shown on the
 * public hub. Contact lives on the entity, not User.preferences.
 * Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { BreederViewDto } from "@/lib/services/breederService.ts";

export function BreederHubContact({ breeder }: { breeder: BreederViewDto }) {
  const t = useTranslations("breeder.hub");

  return (
    <div className="space-y-2 text-sm">
      {breeder.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{breeder.email}</span>
        </p>
      ) : null}
      {breeder.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{breeder.phoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
