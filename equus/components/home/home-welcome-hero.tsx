/**
 * HomeWelcomeHero — guest landing hero card: Equus brand eyebrow, title, and
 * subtitle with decorative blur accents. Pure presentational; receives
 * translated strings from the caller. Used by `GuestLandingContent` (`/`).
 */

type HomeWelcomeHeroProps = {
  title: string;
  subtitle: string;
};

export function HomeWelcomeHero({ title, subtitle }: HomeWelcomeHeroProps) {
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

      <div className="relative space-y-1">
        <p className="text-xs font-medium tracking-widest text-primary uppercase">Equus</p>
        <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
