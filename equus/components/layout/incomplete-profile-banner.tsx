"use client";

/**
 * App-wide nudge when `profileComplete` is false — rendered in `AppShell` below the header.
 * Account profile/preferences keep their own inline banner to avoid duplication.
 */

import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { shouldShowIncompleteProfileBanner } from "@/lib/profile/incompleteProfileBanner.ts";
import { userProfilePath } from "@/lib/navigation/userTabs.ts";

export function IncompleteProfileBanner() {
  const pathname = usePathname();
  const auth = useAppAuth();
  const t = useTranslations("profile");

  const visible = shouldShowIncompleteProfileBanner({
    pathname,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    profileComplete: auth.user?.profileComplete,
  });

  if (!visible || !auth.user) {
    return null;
  }

  return (
    <Alert className="sticky top-0 z-30 flex h-14 w-full items-center justify-center rounded-none bg-primary p-4">
      <AlertDescription className="text-primary-foreground flex flex-wrap items-center gap-4">
        {t("incompleteBanner")}{" "}
        <Link
          href={userProfilePath(auth.user.id)}
          className="font-medium text-primary-foreground underline-offset-4 hover:underline"
        >
          {t("incompleteGlobalBannerLink")}
        </Link>
      </AlertDescription>
    </Alert>
  );
}
