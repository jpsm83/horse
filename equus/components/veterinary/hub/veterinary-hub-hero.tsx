/**
 * VeterinaryHubHero — public veterinary hero band: practice name and location.
 * Pure presentational; receives the veterinary view DTO. The description lives
 * in the About section per the user-linked veterinary layout.
 */

import { Stethoscope } from "lucide-react";

import type { VeterinaryViewDto } from "@/lib/services/veterinaryService.ts";

export function VeterinaryHubHero({ veterinary }: { veterinary: VeterinaryViewDto }) {
  const location = [veterinary.address?.city, veterinary.address?.country]
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
          <Stethoscope className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {location || "Veterinary"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {veterinary.practiceName}
          </h1>
        </div>
      </div>
    </div>
  );
}
