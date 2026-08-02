/**
 * HomeUserAddHorseCard — prominent CTA card linking to the create-horse flow.
 *
 * Pure presentational; receives href + translated strings + icon from the
 * caller. Used by `HomeContent` (`/home`). Links use the i18n-aware `Link`.
 */

import { ChevronRight } from "lucide-react";

import type { NavigationLinkItem } from "@/components/layout/navigation-config.ts";
import { Link } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

type HomeUserAddHorseCardProps = {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: NavigationLinkItem["icon"];
};

export function HomeUserAddHorseCard({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
}: HomeUserAddHorseCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border border-primary/20 bg-linear-to-br from-primary/12 via-card to-secondary/80 p-5 shadow-sm transition-all sm:p-6",
        "hover:border-primary/35 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
      />

      <div className="relative flex items-center gap-4 sm:gap-5">
        <div className="flex size-18 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-[1.02] sm:size-20">
          <Icon className="size-9 sm:size-10" strokeWidth={1.35} aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium tracking-wide text-primary uppercase">{eyebrow}</p>
          <p className="text-lg font-semibold tracking-tight sm:text-xl">{title}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden
        />
      </div>
    </Link>
  );
}
