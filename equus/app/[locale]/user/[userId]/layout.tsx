/**
 * User layout — RSC that pre-fetches the owner user view once per navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache after an expired access token. getServerUserId falls back to the
 * refresh cookie for identity; if identity is still unresolved but a refresh
 * cookie exists, seeding is skipped. All sub-pages (hub, profile, preferences,
 * notifications, workplace, relationships, subscription) read from the cache —
 * no waterfall.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { UserLayoutChrome } from "@/components/user/user-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getUserView } from "@/lib/services/userService.ts";
import connectDb from "@/lib/db.ts";

type UserLayoutProps = {
  children: ReactNode;
  params: Promise<{ userId: string; locale: string }>;
};

export default async function UserLayout({ children, params }: UserLayoutProps) {
  const { userId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const viewerUserId = await getServerUserId();
    const canRecoverSession = !viewerUserId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getUserView(userId, viewerUserId);
      queryClient.setQueryData(queryKeys.users.view(userId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <UserLayoutChrome userId={userId}>{children}</UserLayoutChrome>
    </PreferHydrationBoundary>
  );
}
