/**
 * Horse layout — RSC that pre-fetches the role-aware horse view once per navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer owner
 * cache after an expired access token. getServerUserId falls back to the refresh
 * cookie for identity. If identity still cannot be resolved but a refresh cookie
 * exists, seeding is skipped entirely.
 */

import type { ReactNode } from "react";
import { QueryClient, dehydrate } from "@tanstack/react-query";

import { HorseLayoutChrome } from "@/components/horses/horse-layout-chrome.tsx";
import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getHorseView } from "@/lib/services/horseService.ts";
import connectDb from "@/lib/db.ts";

type HorseLayoutProps = {
  children: ReactNode;
  params: Promise<{ horseId: string; locale: string }>;
};

export default async function HorseLayout({ children, params }: HorseLayoutProps) {
  const { horseId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());

    if (!canRecoverSession) {
      const data = await getHorseView(horseId, userId);
      queryClient.setQueryData(queryKeys.horses.view(horseId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails (404, inactive, etc.)
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <HorseLayoutChrome horseId={horseId}>{children}</HorseLayoutChrome>
    </PreferHydrationBoundary>
  );
}
