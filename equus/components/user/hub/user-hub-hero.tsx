/**
 * UserHubHero — avatar, name, username, and member-since badge.
 * Owner-facing preview of the identity section of the public profile.
 */

"use client";

import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import type { PublicUser } from "@/lib/services/userService.ts";

type Props = {
  user: PublicUser;
};

function initials(pd: Record<string, unknown>): string {
  const first = typeof pd.firstName === "string" ? pd.firstName.trim() : "";
  const last = typeof pd.lastName === "string" ? pd.lastName.trim() : "";
  return [first[0], last[0]].filter(Boolean).join("").toUpperCase() || "?";
}

export function UserHubHero({ user }: Props) {
  const t = useTranslations("userHub");
  const pd = (user.personalDetails ?? {}) as Record<string, unknown>;
  const displayName =
    [pd.firstName, pd.lastName].filter(Boolean).join(" ").trim() || t("anonymousMember");
  const username = typeof pd.username === "string" && pd.username.trim() ? pd.username : undefined;
  const imageUrl = typeof pd.imageUrl === "string" && pd.imageUrl ? pd.imageUrl : undefined;
  const userType = user.userType ?? "individual";

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 shrink-0">
        <AvatarImage src={imageUrl} alt={displayName} />
        <AvatarFallback className="text-lg">{initials(pd)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-xl font-semibold">{displayName}</h2>
        {username ? (
          <p className="text-sm text-muted-foreground">@{username}</p>
        ) : null}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Badge variant="secondary">{t("eyebrow")}</Badge>
          {userType === "business" ? (
            <Badge variant="outline">{t("businessBadge")}</Badge>
          ) : null}
        </div>
      </div>
    </div>
  );
}
