/**
 * GroomHubHero — public groom hero band: display name, location, bio, and icon.
 * Pure presentational; receives the groom view DTO.
 */

import { useTranslations } from "next-intl";
import { Scissors } from "lucide-react";

import type { GroomViewDto } from "@/lib/services/groomService.ts";

export function GroomHubHero({ groom }: { groom: GroomViewDto }) {
  const t = useTranslations("groom.hub");
  const location = [groom.address?.city, groom.address?.country]
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
          <Scissors className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {location || t("title")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {groom.displayName}
          </h1>
          {groom.bio ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {groom.bio}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
