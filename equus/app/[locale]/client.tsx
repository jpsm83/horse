/**
 * GuestLandingContent — guest-only content assembly for the landing page (`/`).
 *
 * Auth check + guest content gating. Signed-in users are redirected to
 * `/home` via a `useEffect` side effect (never blocks render). While auth
 * resolves, the same `HomePageContentSkeleton` used by `loading.tsx` renders.
 * Called by `app/[locale]/page.tsx`.
 */

"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { HomeGuestPanel } from "@/components/home/home-guest-panel.tsx";
import { HomePageContentSkeleton } from "@/components/home/home-page-content-skeleton.tsx";
import { HomeWelcomeHero } from "@/components/home/home-welcome-hero.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRouter } from "@/i18n/navigation.ts";
import { USER_HOME_PATH } from "@/lib/navigation/postAuthRedirect.ts";

export function GuestLandingContent() {
  const router = useRouter();
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading } = useAppAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(USER_HOME_PATH);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <HomePageContentSkeleton suppressHydrationWarning />;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 sm:gap-10 sm:py-12">
      <SectionErrorBoundary message={t("loadFailed")}>
        <HomeWelcomeHero title={t("guestTitle")} subtitle={t("guestDescription")} />
      </SectionErrorBoundary>

      <SectionErrorBoundary message={t("loadFailed")}>
        <HomeGuestPanel
          title={t("getStartedTitle")}
          description={t("getStartedDescription")}
          signInLabel={tCommon("signIn")}
          signUpLabel={tCommon("signUp")}
        />
      </SectionErrorBoundary>
    </div>
  );
}
