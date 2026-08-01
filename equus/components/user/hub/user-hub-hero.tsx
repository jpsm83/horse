/**
 * UserHubHero — horse-hub-style identity band (avatar, display name, @username,
 * business badge) for the shared user hub. Read-only; consumes the server-filtered
 * `identity` section projection (no visibility popovers on the hub).
 */

"use client";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import type { UserHubIdentitySection } from "@/lib/users/userHubSections.ts";

type Props = {
  identity: UserHubIdentitySection;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

export function UserHubHero({ identity }: Props) {
  const t = useTranslations("userHub");
  const displayName =
    [identity.firstName, identity.lastName].filter(Boolean).join(" ").trim() ||
    identity.businessName?.trim() ||
    identity.username?.trim() ||
    t("anonymousMember");

  return (
    <div className="relative overflow-hidden rounded-lg border bg-linear-to-r from-primary/8 via-card to-accent/10 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16 shrink-0 sm:size-20">
          <AvatarImage src={identity.imageUrl} alt={displayName} />
          <AvatarFallback className="text-lg">{initials(displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
            {displayName}
          </h1>
          {identity.username ? (
            <p className="text-sm text-muted-foreground">@{identity.username}</p>
          ) : null}
          {identity.businessName ? (
            <Badge variant="secondary" className="mt-1.5">
              {t("businessBadge")}
            </Badge>
          ) : null}
          {identity.bio?.trim() ? (
            <p className="mt-2 line-clamp-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {identity.bio}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
