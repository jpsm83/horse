/**
 * UserRelationshipListSection — accepted/active relationship list.
 *
 * Shows horse name, entity, role, and join date.
 * Full list endpoint (`GET /api/v1/users/me/relationships?status=accepted`) is structured
 * for future implementation; shows a placeholder until the endpoint is extended.
 */

"use client";

import { useTranslations } from "next-intl";
import { Clock } from "lucide-react";

export function UserRelationshipListSection() {
  const t = useTranslations("userRelationships");

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-8 text-center">
      <Clock className="h-8 w-8 text-muted-foreground/50" aria-hidden />
      <p className="text-sm text-muted-foreground">{t("listComingSoon")}</p>
    </div>
  );
}
