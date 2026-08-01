/**
 * UserHubAddress — read-only location for the shared user hub.
 * Consumes the server-filtered `address` section projection.
 */

"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserHubAddressSection } from "@/lib/users/userHubSections.ts";

type Props = {
  address: UserHubAddressSection;
};

export function UserHubAddress({ address }: Props) {
  const t = useTranslations("userHub");

  if (!address.location?.trim()) {
    return <p className="text-sm text-muted-foreground">{t("address.empty")}</p>;
  }

  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground">
      <MapPin className="size-4 shrink-0" aria-hidden />
      <span className="font-medium">{t("address.location")}:</span> {address.location}
    </p>
  );
}
