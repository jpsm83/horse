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
    <div className="border-b border-border bg-muted/40 px-4 py-2">
      <Alert className="mx-auto max-w-3xl border-0 bg-transparent p-0 shadow-none">
        <AlertDescription>
          {t("incompleteBanner")}{" "}
          <Link
            href="/profile"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("incompleteGlobalBannerLink")}
          </Link>
        </AlertDescription>
      </Alert>
    </div>
  );
}
