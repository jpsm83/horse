/**
 * UserHubIdentification — read-only nationality / phone / ID for the shared user hub.
 * Consumes the server-filtered `identification` section projection.
 */

"use client";

import { useTranslations } from "next-intl";
import type { UserHubIdentificationSection } from "@/lib/users/userHubSections.ts";

type Props = {
  identification: UserHubIdentificationSection;
};

function valueOrDash(value?: string): string {
  return value?.trim() ? value : "—";
}

export function UserHubIdentification({ identification }: Props) {
  const t = useTranslations("userHub");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <p className="text-xs font-medium text-muted-foreground">{t("identification.nationality")}</p>
        <p className="text-sm">{valueOrDash(identification.nationality)}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{t("identification.phone")}</p>
        <p className="text-sm">{valueOrDash(identification.phoneNumber)}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{t("identification.idType")}</p>
        <p className="text-sm">{valueOrDash(identification.idType)}</p>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground">{t("identification.idNumber")}</p>
        <p className="text-sm">{valueOrDash(identification.idNumber)}</p>
      </div>
    </div>
  );
}
