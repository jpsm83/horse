"use client";

/**
 * App-wide nudge when `profileComplete` is false — rendered in `AppShell` below the header.
 * The `/profile` page keeps its own inline banner to avoid duplication.
 */

import { useTranslations } from "next-intl";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { Link, usePathname } from "@/i18n/navigation.ts";
import { shouldShowIncompleteProfileBanner } from "@/lib/profile/incompleteProfileBanner.ts";

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

  if (!visible) {
    return null;
  }

  return (  
      <Alert className="sticky top-0 z-30 flex h-14 w-full items-center justify-center rounded-none bg-primary p-4">
        <AlertDescription className="text-primary-foreground flex flex-wrap items-center gap-4">
          {t("incompleteBanner")}{" "}
          <Link
            href="/profile"
            className="font-medium text-white underline-offset-4 hover:underline"
          >
            {t("incompleteGlobalBannerLink")}
          </Link>
        </AlertDescription>
      </Alert>
  );
}



