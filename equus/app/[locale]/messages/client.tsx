"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { MessagesModule } from "@/components/chat/messages-module.tsx";
import { AppHomeLink } from "@/components/navigation/app-home-link.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";

export function MessagesClient() {
  const router = useRouter();
  const t = useTranslations("messages");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading: authLoading } = useAppAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/messages"));
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex flex-1 items-center justify-center py-16">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </header>
      <MessagesModule />
      <p className="text-center text-sm text-muted-foreground">
        <AppHomeLink className="font-medium text-foreground underline-offset-4 hover:underline">
          {tCommon("home")}
        </AppHomeLink>
      </p>
    </div>
  );
}
