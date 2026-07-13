/**
 * Loading skeletons for placeholder and invite-hub pages.
 * Used during route segment load and client auth check.
 */

"use client";

import { useTranslations } from "next-intl";

import { AuthPageShell } from "@/components/auth/auth-page-shell.tsx";
import { AppHomeLink } from "@/components/navigation/app-home-link.tsx";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors `/my/*`, `/create/*` (non-horse), and discover directory placeholders. */
export function EntityPlaceholderSkeleton() {
  return (
    <div
      className="mx-auto flex w-full  flex-1 flex-col gap-4 px-4 py-12"
      aria-busy
      aria-hidden
    >
      <Skeleton className="h-9 w-52 max-w-full" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

/** Mirrors `/notifications` placeholder. */
export function NotificationsPlaceholderSkeleton() {
  return (
    <div
      className="mx-auto flex w-full  flex-1 flex-col gap-4 px-4 py-12"
      aria-busy
      aria-hidden
    >
      <Skeleton className="h-9 w-56 max-w-full" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

type InviteHubTitleNamespace =
  | "invites.relationships"
  | "invites.workplaces"
  | "invites.ownershipTransfers";

/** Mirrors invite list cards inside AuthPageShell. */
export function InviteHubListSkeleton() {
  return (
    <ul className="space-y-3" aria-busy aria-hidden>
      {Array.from({ length: 2 }, (_, index) => (
        <li key={index} className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-5 w-40 max-w-full" />
          <Skeleton className="h-4 w-56 max-w-full" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Full invite hub shell — `/relationships`, `/workplaces`, `/ownership-transfers`. */
export function InviteHubPageSkeleton({
  titleNamespace,
}: {
  titleNamespace: InviteHubTitleNamespace;
}) {
  const t = useTranslations(titleNamespace);
  const tCommon = useTranslations("common");

  return (
    <AuthPageShell
      title={t("title")}
      description={tCommon("loading")}
      footer={
        <AppHomeLink className="font-medium text-foreground underline-offset-4 hover:underline">
          {tCommon("home")}
        </AppHomeLink>
      }
    >
      <InviteHubListSkeleton />
    </AuthPageShell>
  );
}
