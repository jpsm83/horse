/**
 * RidingClubHubHero — public riding club hero band: club name, location, and
 * description. Pure presentational; receives the riding club view DTO.
 */

import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import type { RidingClubViewDto } from "@/lib/services/ridingClubService.ts";

export function RidingClubHubHero({ ridingClub }: { ridingClub: RidingClubViewDto }) {
  const t = useTranslations("ridingClub.hub");
  const location = [ridingClub.address?.city, ridingClub.address?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-8 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-primary/5 blur-3xl"
      />
      <div className="relative flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <ShieldCheck className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {location || t("title")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {ridingClub.clubName}
          </h1>
          {ridingClub.description ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {ridingClub.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
