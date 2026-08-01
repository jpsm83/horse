/**
 * UserHubContact — read-only email for the shared user hub.
 * Consumes the server-filtered `contact` section projection (email; phone moved
 * to the Identification section).
 */

"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserHubContactSection } from "@/lib/users/userHubSections.ts";

type Props = {
  contact: UserHubContactSection;
};

export function UserHubContact({ contact }: Props) {
  const t = useTranslations("userHub");

  if (!contact.email?.trim()) {
    return <p className="text-sm text-muted-foreground">{t("contact.empty")}</p>;
  }

  return (
    <p className="flex items-center gap-2 text-sm">
      <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="text-xs font-medium text-muted-foreground">{t("contact.email")}:</span>
      <span>{contact.email}</span>
    </p>
  );
}
