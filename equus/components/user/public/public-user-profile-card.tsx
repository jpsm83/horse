/**
 * Entity-style public user profile card — view-only fields from `GET /api/v1/users/:id`.
 */

"use client";

import { Mail, Phone, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";
import { ExternalLink } from "@/components/navigation/external-link.tsx";
import type { PublicUserProfileCard } from "@/lib/api/userClient.ts";

type PublicUserProfileCardViewProps = {
  user: PublicUserProfileCard;
};

function readInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function resolveDisplayName(
  user: PublicUserProfileCard,
  memberFallback: string,
): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (user.username?.trim()) return user.username.trim();
  return memberFallback;
}

export function PublicUserProfileCardView({ user }: PublicUserProfileCardViewProps) {
  const t = useTranslations("userProfile");
  const displayName = resolveDisplayName(user, t("memberFallback"));
  const hasContact = Boolean(user.email?.trim() || user.phone?.trim());
  const bio = user.bio?.trim();

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="border-b bg-linear-to-r from-primary/8 via-card to-accent/10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
          <Avatar className="size-24 shrink-0 ring-2 ring-primary/15 sm:size-28">
            {user.imageUrl ? <AvatarImage src={user.imageUrl} alt="" className="object-cover" /> : null}
            <AvatarFallback className="bg-primary/5 text-xl font-semibold text-primary">
              {readInitials(displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-primary">
              <UserRound className="size-4 shrink-0" aria-hidden />
              <p className="text-xs font-medium tracking-widest uppercase">{t("eyebrow")}</p>
            </div>
            <CardTitle className="text-2xl tracking-tight sm:text-3xl">{displayName}</CardTitle>
            {user.username ? (
              <CardDescription className="text-base">@{user.username}</CardDescription>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        <section className="space-y-2">
          <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
            {t("about")}
          </h2>
          <p className="text-sm leading-relaxed text-foreground">
            {bio || t("noBio")}
          </p>
        </section>

        {hasContact ? (
          <section className="space-y-3">
            <h2 className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {t("contact")}
            </h2>
            <dl className="space-y-3 text-sm">
              {user.email ? (
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <dt className="sr-only">{t("email")}</dt>
                    <dd>
                      <ExternalLink
                        href={`mailto:${user.email}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {user.email}
                      </ExternalLink>
                    </dd>
                  </div>
                </div>
              ) : null}
              {user.phone ? (
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <dt className="sr-only">{t("phone")}</dt>
                    <dd>
                      <ExternalLink
                        href={`tel:${user.phone}`}
                        className="font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {user.phone}
                      </ExternalLink>
                    </dd>
                  </div>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}
