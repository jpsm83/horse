/**
 * TrainerHubContact — trainer business contact (email / phone) shown on the
 * public hub. Contact lives on the entity, not User.preferences.
 * Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { TrainerViewDto } from "@/lib/services/trainerService.ts";

export function TrainerHubContact({ trainer }: { trainer: TrainerViewDto }) {
  const t = useTranslations("trainer.hub");

  return (
    <div className="space-y-2 text-sm">
      {trainer.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{trainer.email}</span>
        </p>
      ) : null}
      {trainer.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{trainer.phoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
