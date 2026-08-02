/**
 * TransportHubContact — transport business contact (email / phone / emergency
 * phone) shown on the public hub. Contact lives on the entity, not
 * User.preferences. Pure presentational.
 */

import { useTranslations } from "next-intl";

import type { TransportViewDto } from "@/lib/services/transportService.ts";

export function TransportHubContact({ transport }: { transport: TransportViewDto }) {
  const t = useTranslations("transport.hub");

  return (
    <div className="space-y-2 text-sm">
      {transport.email ? (
        <p>
          <span className="text-muted-foreground">{t("email")}: </span>
          <span>{transport.email}</span>
        </p>
      ) : null}
      {transport.phoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("phone")}: </span>
          <span>{transport.phoneNumber}</span>
        </p>
      ) : null}
      {transport.emergencyPhoneNumber ? (
        <p>
          <span className="text-muted-foreground">{t("emergencyPhone")}: </span>
          <span>{transport.emergencyPhoneNumber}</span>
        </p>
      ) : null}
    </div>
  );
}
