/**
 * CoachHubHero — public coach hero band: display name, location, and bio.
 * Pure presentational; receives the coach view DTO.
 */

import { GraduationCap } from "lucide-react";
import { useTranslations } from "next-intl";

import type { CoachViewDto } from "@/lib/services/coachService.ts";

export function CoachHubHero({ coach }: { coach: CoachViewDto }) {
  const t = useTranslations("coach.hub");
  const location = [coach.address?.city, coach.address?.country]
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
          <GraduationCap className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {location || t("title")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {coach.displayName}
          </h1>
          {coach.bio ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {coach.bio}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
