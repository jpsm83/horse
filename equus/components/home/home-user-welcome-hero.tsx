/**
 * HomeUserWelcomeHero — signed-in user hero card: Equus brand eyebrow, avatar,
 * title, and subtitle with decorative blur accents. Pure presentational;
 * receives translated strings from the caller. Used by `HomeContent` (`/home`).
 */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function readInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

type HomeUserWelcomeHeroProps = {
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  avatarLabel?: string;
};

export function HomeUserWelcomeHero({
  title,
  subtitle,
  avatarUrl,
  avatarLabel,
}: HomeUserWelcomeHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-8 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-primary/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-40 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative flex items-start gap-4 sm:items-center">
        {avatarLabel ? (
          <Avatar size="lg" className="size-14 shrink-0 ring-2 ring-primary/15">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary/5 text-base font-semibold text-primary">
              {readInitials(avatarLabel)}
            </AvatarFallback>
          </Avatar>
        ) : null}

        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium tracking-widest text-primary uppercase">Equus</p>
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
