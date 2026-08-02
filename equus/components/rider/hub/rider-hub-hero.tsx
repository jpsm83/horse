/**
 * RiderHubHero — public rider hero band: display name, location, and bio.
 * Pure presentational; receives the rider view DTO.
 */

import { Medal } from "lucide-react";
import { useTranslations } from "next-intl";

import type { RiderViewDto } from "@/lib/services/riderService.ts";

export function RiderHubHero({ rider }: { rider: RiderViewDto }) {
  const t = useTranslations("rider.hub");
  const location = [rider.address?.city, rider.address?.country]
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
          <Medal className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {location || t("title")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {rider.displayName}
          </h1>
          {rider.bio ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {rider.bio}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
