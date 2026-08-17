/**
 * HomeContent — signed-in action inbox (`/home`).
 *
 * Shows pending relationship and workplace invites only — not owned-entity
 * rosters or create shortcuts. Guests redirect to sign-in.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { HomeActionInbox } from "@/components/home/home-action-inbox.tsx";
import { HomePageContentSkeleton } from "@/components/home/home-page-content-skeleton.tsx";
import { HomeUserWelcomeHero } from "@/components/home/home-user-welcome-hero.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useUserProfile } from "@/hooks/queries/useCurrentUser.ts";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath, USER_HOME_PATH } from "@/lib/navigation/postAuthRedirect.ts";

export function HomeContent() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("home");
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAppAuth();
  const { data: profile, isPending: isProfilePending } = useUserProfile(isAuthenticated);

  const isLoading = isAuthLoading || (isAuthenticated && isProfilePending);

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

      <section aria-labelledby="home-inbox-heading">
        <div className="mb-4 space-y-1">
          <h2 id="home-inbox-heading" className="text-lg font-semibold tracking-tight sm:text-xl">
            {t("inboxHeading")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("inboxDescription")}</p>
        </div>

        <SectionErrorBoundary message={t("loadFailed")}>
          <HomeActionInbox userId={user.id} />
        </SectionErrorBoundary>
      </section>
    </div>
  );
}
