/**
 * Session-aware status page buttons — hides sign-in when the user is already logged in.
 */

"use client";

import { useTranslations } from "next-intl";

import type { StatusPageAction } from "@/components/status/status-page-shell.tsx";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppAuth } from "@/hooks/use-app-auth.ts";
import { Link } from "@/i18n/navigation.ts";
import { buildStatusPageActions } from "@/lib/navigation/statusPageActions.ts";
import { cn } from "@/lib/utils";

export function AuthAwareStatusActions() {
  const { isAuthenticated, isLoading } = useAppAuth();
  const tCommon = useTranslations("common");
  const tHeader = useTranslations("header");

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Skeleton className="h-9 w-full sm:w-28" />
        <Skeleton className="h-9 w-full sm:w-28" />
      </div>
    );
  }

  const actions: StatusPageAction[] = buildStatusPageActions({
    isAuthenticated,
    labels: {
      guestHome: tCommon("home"),
      userHome: tHeader("home"),
      signIn: tCommon("signIn"),
    },
  });

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
      {actions.map((action) => (
        <Link
          key={action.href + action.label}
          href={action.href}
          className={cn(
            buttonVariants({ variant: action.variant ?? "default" }),
            "w-full sm:w-auto",
          )}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}
