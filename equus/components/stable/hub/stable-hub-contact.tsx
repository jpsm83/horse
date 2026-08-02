/**
 * StableHubContact — stable business contact (email / phone / website) shown on
 * the public hub. Contact lives on the entity, not User.preferences.
 * Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { StableViewDto } from "@/lib/services/stableService.ts";

export function StableHubContact({ stable }: { stable: StableViewDto }) {
  const t = useTranslations("stable.hub");

  return (
    <div className="space-y-2 text-sm">
      {stable.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{stable.email}</span>
        </p>
      ) : null}
      {stable.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{stable.phoneNumber}</span>
        </p>
      ) : null}
      {stable.websiteUrl ? (
        <p>
          <span className="text-muted-foreground">{t("website")}: </span>
          <span>{stable.websiteUrl}</span>
        </p>
      ) : null}
    </div>
  );
}
