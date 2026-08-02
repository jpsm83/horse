/**
 * TrainerHubHero — public trainer hero band: display name, location, and bio.
 * Pure presentational; receives the trainer view DTO.
 */

import { GraduationCap } from "lucide-react";

import type { TrainerViewDto } from "@/lib/services/trainerService.ts";

export function TrainerHubHero({ trainer }: { trainer: TrainerViewDto }) {
  const location = [trainer.address?.city, trainer.address?.country]
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
            {location || "Trainer"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {trainer.displayName}
          </h1>
          {trainer.bio ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {trainer.bio}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
