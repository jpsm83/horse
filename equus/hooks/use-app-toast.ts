"use client";

import { useCallback } from "react";
import { useTranslations } from "next-intl";

import { appToast } from "@/lib/ui/toast.ts";

/** Reusable toast API for any client component, form, or action button. */
export function useAppToast() {
  const t = useTranslations("toast");

  const actionFailed = useCallback(() => {
    appToast.error(t("actionFailed"));
  }, [t]);

  return {
    success: appToast.success,
    error: appToast.error,
    actionFailed,
  };
}
