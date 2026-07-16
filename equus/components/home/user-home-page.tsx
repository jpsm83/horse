"use client";

/**
 * Signed-in user home (`/home`) — welcome hub, add-horse quick action, owned subsection links.
 * Guests are redirected to sign-in. Settings live on `/profile`, not here.
 */

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import {
  CREATE_MENU_HORSE_LINK,
  filterHomeSubsectionLinks,
  type NavigationLinkItem,
} from "@/components/layout/navigation-config.ts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserNavigation, useUserProfile } from "@/hooks/queries/useCurrentUser.ts";
import { Link, usePathname, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath, USER_HOME_PATH } from "@/lib/navigation/postAuthRedirect.ts";
import { cn } from "@/lib/utils";

function readInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function UserHomeWelcomeHero({
  title,
  subtitle,
  avatarUrl,
  avatarLabel,
}: {
  title: string;
  subtitle: string;
  avatarUrl?: string | null;
  avatarLabel?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card px-6 py-8 shadow-sm">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-20 -left-10 size-40 rounded-full bg-accent/15 blur-3xl"
      />

      <div className="relative flex items-start gap-4 sm:items-center">
        {avatarLabel ? (
          <Avatar size="lg" className="size-14 shrink-0 ring-2 ring-primary/15">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback className="bg-primary/10 text-base font-semibold text-primary">
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

function UserHomeAddHorseCard({
  href,
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  icon: NavigationLinkItem["icon"];
}) {
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

function UserHomeSubsectionCard({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: NavigationLinkItem["icon"];
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-card/90 p-4 shadow-sm transition-all",
        "hover:border-primary/25 hover:bg-card hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
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

export function UserHomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("home");
  const tCreate = useTranslations("header.create");
  const tMyOwn = useTranslations("header.myOwn");
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: ownedNavigation, isPending: isNavPending } = useUserNavigation(isAuthenticated);
  const { data: profile, isPending: isProfilePending } = useUserProfile(isAuthenticated);

  const isLoading = isAuthLoading || (isAuthenticated && (isNavPending || isProfilePending));

  useEffect(() => {
    if (pathname !== USER_HOME_PATH) return;
    if (!isAuthLoading && !isAuthenticated) {
      router.replace(buildSignInPath());
    }
  }, [isAuthenticated, isAuthLoading, pathname, router]);

  if (isLoading || !isAuthenticated || !user) {
    return <Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" />;
  }

  const details = profile?.personalDetails ?? {};
  const profileFirstName = typeof details.firstName === "string" ? details.firstName : undefined;
  const profileLastName = typeof details.lastName === "string" ? details.lastName : undefined;
  const profileImageUrlValue = typeof details.imageUrl === "string" ? details.imageUrl.trim() || undefined : undefined;
  const displayName = [profileFirstName, profileLastName].filter(Boolean).join(" ") || user.email;

  const subsectionLinks = filterHomeSubsectionLinks(ownedNavigation ?? null);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:py-12">
      <UserHomeWelcomeHero
        title={displayName ? t("welcomeUser", { name: displayName }) : t("guestTitle")}
        subtitle={t("welcomeSubtitle")}
        avatarUrl={profileImageUrlValue}
        avatarLabel={displayName ?? undefined}
      />

      <section aria-labelledby="user-home-add-horse-heading">
        <h2 id="user-home-add-horse-heading" className="sr-only">
          {tCreate("addHorse")}
        </h2>
        <UserHomeAddHorseCard
          href={CREATE_MENU_HORSE_LINK.href}
          eyebrow={t("addHorseEyebrow")}
          title={tCreate("addHorse")}
          description={t("addHorseDescription")}
          icon={CREATE_MENU_HORSE_LINK.icon}
        />
      </section>

      {subsectionLinks.length > 0 ? (
        <section aria-labelledby="user-home-profiles-heading">
          <div className="mb-4 space-y-1">
            <h2
              id="user-home-profiles-heading"
              className="text-lg font-semibold tracking-tight sm:text-xl"
            >
              {t("profilesHeading")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("profilesDescription")}</p>
          </div>

          <nav className="grid gap-3 sm:grid-cols-2" aria-label={t("subsectionsLabel")}>
            {subsectionLinks.map(({ key, href, icon }) => (
              <UserHomeSubsectionCard key={key} href={href} label={tMyOwn(key)} icon={icon} />
            ))}
          </nav>
        </section>
      ) : null}
    </div>
  );
}
