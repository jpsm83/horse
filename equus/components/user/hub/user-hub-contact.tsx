/**
 * UserHubContact — email and phone number preview section.
 */

"use client";

import { useTranslations } from "next-intl";
import type { PublicUser } from "@/lib/services/userService.ts";

type Props = {
  user: PublicUser;
};

export function UserHubContact({ user }: Props) {
  const t = useTranslations("userHub");
  const pd = (user.personalDetails ?? {}) as Record<string, unknown>;

  const email = typeof pd.email === "string" && pd.email.trim() ? pd.email.trim() : null;
  const phone =
    typeof pd.phoneNumber === "string" && pd.phoneNumber.trim() ? pd.phoneNumber.trim() : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("contact.email")}</p>
          <p className="text-sm">{email ?? <span className="text-muted-foreground">—</span>}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("contact.phone")}</p>
          <p className="text-sm">{phone ?? <span className="text-muted-foreground">—</span>}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t("contact.visibilityHint")}</p>
    </div>
  );
}
