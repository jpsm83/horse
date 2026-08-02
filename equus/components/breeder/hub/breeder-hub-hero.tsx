/**
 * BreederHubHero — public breeder hero band: operation name, location,
 * description, and image. Pure presentational; receives the breeder view DTO.
 */

import { useTranslations } from "next-intl";
import { Sprout } from "lucide-react";

import type { BreederViewDto } from "@/lib/services/breederService.ts";

export function BreederHubHero({ breeder }: { breeder: BreederViewDto }) {
  const t = useTranslations("breeder.hub");
  const location = [breeder.address?.city, breeder.address?.country]
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
          <Sprout className="size-7" aria-hidden />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">
            {location || t("title")}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {breeder.operationName}
          </h1>
          {breeder.description ? (
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {breeder.description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
