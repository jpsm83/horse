"use client";

import { useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation.ts";
import type { HorseListItem } from "@/lib/services/horseService.ts";

type HorseCardProps = {
  horse: HorseListItem;
};

export function HorseCard({ horse }: HorseCardProps) {
  const tCommon = useTranslations("common");

  const initials = horse.name
    ? horse.name.split(/\s+/).map((p) => p.charAt(0).toUpperCase()).join("").slice(0, 2)
    : tCommon("horseFallback").charAt(0);

  return (
    <Link
      href={`/horses/${horse.id}`}
      className="group flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent/5"
    >
      <Avatar className="size-14 shrink-0 rounded-full">
        {horse.profileImageUrl ? (
          <AvatarImage src={horse.profileImageUrl} alt="" className="object-cover" />
        ) : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium group-hover:text-accent-foreground">
          {horse.name ?? tCommon("horseFallback")}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[horse.breed, horse.sex, horse.color].filter(Boolean).join(" · ") || "—"}
        </p>
        {horse.primaryDiscipline ? (
          <p className="truncate text-xs text-muted-foreground">
            {horse.primaryDiscipline}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
