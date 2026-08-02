/**
 * HomeGuestPanel — guest CTA card with sign-in and sign-up buttons.
 *
 * Pure presentational; receives translated strings from the caller. Called by
 * `GuestLandingContent` (`/`). Links use the i18n-aware `Link` so locale
 * prefixes stay correct.
 */

import { UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation.ts";
import { cn } from "@/lib/utils";

type HomeGuestPanelProps = {
  title: string;
  description: string;
  signInLabel: string;
  signUpLabel: string;
};

export function HomeGuestPanel({
  title,
  description,
  signInLabel,
  signUpLabel,
}: HomeGuestPanelProps) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="border-b bg-linear-to-r from-primary/10 via-card to-accent/10 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <UserRound className="size-5" aria-hidden />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-6 py-5 sm:flex-row">
        <Link href="/signin" className={cn(buttonVariants({ size: "lg" }), "w-full sm:flex-1")}>
          {signInLabel}
        </Link>
        <Link
          href="/signup"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:flex-1")}
        >
          {signUpLabel}
        </Link>
      </div>
    </div>
  );
}
