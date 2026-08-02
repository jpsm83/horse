/**
 * HomeUserSubsectionCard — grid card for a single owned entity subsection on
 * the signed-in home (`/home`). Pure presentational; receives href + label +
 * icon from the caller. Uses the i18n-aware `Link`.
 */

import { ChevronRight } from "lucide-react";

import type { NavigationLinkItem } from "@/components/layout/navigation-config.ts";
import { Link } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

type HomeUserSubsectionCardProps = {
  href: string;
  label: string;
  icon: NavigationLinkItem["icon"];
};

export function HomeUserSubsectionCard({ href, label, icon: Icon }: HomeUserSubsectionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-card/90 p-4 shadow-sm transition-all",
        "hover:border-primary/25 hover:bg-card hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="size-5" strokeWidth={1.75} aria-hidden />
      </div>

      <span className="min-w-0 flex-1 font-medium leading-snug">{label}</span>

      <ChevronRight
        className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
        aria-hidden
      />
    </Link>
  );
}
