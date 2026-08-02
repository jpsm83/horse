/**
 * TransportHubHero — public transport hero band: company name, location,
 * description. Pure presentational; receives the transport view DTO.
 */

import { Truck } from "lucide-react";

import type { TransportViewDto } from "@/lib/services/transportService.ts";

export function TransportHubHero({ transport }: { transport: TransportViewDto }) {
  const location = [transport.address?.city, transport.address?.country]
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
          <Truck className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {location || "Transport"}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {transport.companyName}
          </h1>
          {transport.description ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {transport.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
