"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "@/i18n/navigation.ts";
import { fetchCurrentUser } from "@/lib/api/authClient.ts";

/** Auth-gated notifications placeholder. */
export function NotificationsPlaceholderPage() {
  const router = useRouter();
  const t = useTranslations("header");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(true);

  const verifyAuth = useCallback(async () => {
    try {
      await fetchCurrentUser();
    } catch {
      router.replace("/signin?next=%2Fnotifications");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void verifyAuth();
  }, [verifyAuth]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12">
        <Alert>
          <AlertDescription>{tCommon("loading")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("notifications")}</h1>
      <p className="text-sm text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
