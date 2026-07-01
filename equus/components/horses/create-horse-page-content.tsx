"use client";

/**
 * Create-horse page body — auth gate, skeleton, form, and mutation overlay.
 */

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { CreateHorseForm } from "@/components/horses/create-horse-form.tsx";
import { CreateHorsePageSkeleton } from "@/components/horses/create-horse-page-skeleton.tsx";
import { LoadingOverlay } from "@/components/ui/loading-overlay.tsx";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { useRouter } from "@/i18n/navigation.ts";
import { buildSignInPath } from "@/lib/navigation/postAuthRedirect.ts";

export function CreateHorsePageContent() {
  const router = useRouter();
  const t = useTranslations("createHorse");
  const tCommon = useTranslations("common");
  const { isAuthenticated, isLoading } = useAppAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(buildSignInPath("/create/horse"));
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <CreateHorsePageSkeleton />;
  }

  return (
    <div
      className="relative isolate z-0 flex min-h-0 flex-1 flex-col"
      aria-busy={isSubmitting}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:gap-6 sm:py-12">
        <div className="space-y-2 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <CreateHorseForm onSubmittingChange={setIsSubmitting} />
      </div>

      <LoadingOverlay active={isSubmitting} label={tCommon("loading")} />
    </div>
  );
}
