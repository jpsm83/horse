/**
 * UserHubAbout — bio, location, and profession preview section.
 */

"use client";

import { useTranslations } from "next-intl";
import type { PublicUser } from "@/lib/services/userService.ts";

type Props = {
  user: PublicUser;
};

export function UserHubAbout({ user }: Props) {
  const t = useTranslations("userHub");
  const pd = (user.personalDetails ?? {}) as Record<string, unknown>;

  const bio = typeof pd.bio === "string" && pd.bio.trim() ? pd.bio.trim() : null;
  const address = (pd.address ?? {}) as Record<string, unknown>;
  const city = typeof address.city === "string" && address.city.trim() ? address.city.trim() : null;
  const country = typeof address.country === "string" && address.country.trim() ? address.country.trim() : null;
  const location = [city, country].filter(Boolean).join(", ") || null;

  const businessName =
    user.userType === "business" && user.businessDetails
      ? (user.businessDetails as Record<string, unknown>).businessName as string | undefined
      : undefined;

  if (!bio && !location && !businessName) {
    return <p className="text-sm text-muted-foreground">{t("noAbout")}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {bio ? <p className="text-sm leading-relaxed">{bio}</p> : null}
      {businessName ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{t("businessLabel")}</span> {businessName}
        </p>
      ) : null}
      {location ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">{t("locationLabel")}</span> {location}
        </p>
      ) : null}
    </div>
  );
}
