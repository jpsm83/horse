"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation.ts";
import type { AppLocale } from "@/i18n/resolveLocale.ts";
import { syncLocaleCookie } from "@/i18n/syncLocaleCookie.ts";
import { updatePreferredLanguage } from "@/lib/api/authClient.ts";

type LocaleSwitcherProps = {
  className?: string;
  /** When true, persist choice to the user profile (signed-in only). */
  isAuthenticated?: boolean;
};

export function LocaleSwitcher({ className, isAuthenticated = false }: LocaleSwitcherProps) {
  const t = useTranslations("localeSwitcher");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) return;

    syncLocaleCookie(nextLocale);
    startTransition(() => {
      void (async () => {
        if (isAuthenticated) {
          await updatePreferredLanguage(nextLocale);
        }
        router.replace(pathname, { locale: nextLocale });
      })();
    });
  }

  return (
    <div className={className} role="group" aria-label={t("label")}>
      <div className="inline-flex rounded-md border p-0.5">
        {(["en", "es"] as const).map((code) => (
          <Button
            key={code}
            type="button"
            size="sm"
            variant={locale === code ? "default" : "ghost"}
            className="h-8 px-3"
            disabled={isPending}
            onClick={() => switchLocale(code)}
          >
            {t(code)}
          </Button>
        ))}
      </div>
    </div>
  );
}
