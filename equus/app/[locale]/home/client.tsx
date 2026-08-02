/**
 * HomeContent — signed-in user home content assembly (`/home`).
 *
 * Auth gate + data fetch (profile + owned navigation) + user home panels.
 * Guests are redirected to sign-in via a `useEffect` side effect. While auth
 * or data resolves, the same `HomePageContentSkeleton` used by `loading.tsx`
 * renders. Called by `app/[locale]/home/page.tsx`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import {
  CREATE_MENU_HORSE_LINK,
  filterHomeSubsectionLinks,
} from "@/components/layout/navigation-config.ts";
import { HomePageContentSkeleton } from "@/components/home/home-page-content-skeleton.tsx";
import { HomeUserAddHorseCard } from "@/components/home/home-user-add-horse-card.tsx";
import { HomeUserSubsectionCard } from "@/components/home/home-user-subsection-card.tsx";
import { HomeUserWelcomeHero } from "@/components/home/home-user-welcome-hero.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserNavigation, useUserProfile } from "@/hooks/queries/useCurrentUser.ts";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath, USER_HOME_PATH } from "@/lib/navigation/postAuthRedirect.ts";

export function HomeContent() {
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
    return <HomePageContentSkeleton suppressHydrationWarning />;
  }

  const details = profile?.personalDetails ?? {};
  const profileFirstName = typeof details.firstName === "string" ? details.firstName : undefined;
  const profileLastName = typeof details.lastName === "string" ? details.lastName : undefined;
  const profileImageUrlValue =
    typeof details.imageUrl === "string" ? details.imageUrl.trim() || undefined : undefined;
  const displayName = [profileFirstName, profileLastName].filter(Boolean).join(" ") || user.email;

  const subsectionLinks = filterHomeSubsectionLinks(ownedNavigation ?? null);

  return (
    <div
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:py-12"
      suppressHydrationWarning
    >
      <SectionErrorBoundary message={t("loadFailed")}>
        <HomeUserWelcomeHero
          title={displayName ? t("welcomeUser", { name: displayName }) : t("guestTitle")}
          subtitle={t("welcomeSubtitle")}
          avatarUrl={profileImageUrlValue}
          avatarLabel={displayName ?? undefined}
        />
      </SectionErrorBoundary>

      <section aria-labelledby="user-home-add-horse-heading">
        <h2 id="user-home-add-horse-heading" className="sr-only">
          {tCreate("addHorse")}
        </h2>
        <SectionErrorBoundary message={t("loadFailed")}>
          <HomeUserAddHorseCard
            href={CREATE_MENU_HORSE_LINK.href}
            eyebrow={t("addHorseEyebrow")}
            title={tCreate("addHorse")}
            description={t("addHorseDescription")}
            icon={CREATE_MENU_HORSE_LINK.icon}
          />
        </SectionErrorBoundary>
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

          <SectionErrorBoundary message={t("loadFailed")}>
            <nav className="grid gap-3 sm:grid-cols-2" aria-label={t("subsectionsLabel")}>
              {subsectionLinks.map(({ key, href, icon }) => (
                <HomeUserSubsectionCard key={key} href={href} label={tMyOwn(key)} icon={icon} />
              ))}
            </nav>
          </SectionErrorBoundary>
        </section>
      ) : null}
    </div>
  );
}
