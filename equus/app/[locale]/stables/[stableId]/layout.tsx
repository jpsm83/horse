/**
 * Stable layout — RSC that pre-fetches the role-aware stable view once per
 * navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache. getServerUserId falls back to the refresh cookie for identity;
 * if identity is unresolved but a refresh cookie exists, seeding is skipped.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { StableLayoutChrome } from "@/components/stable/stable-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getStableView } from "@/lib/services/stableService.ts";
import connectDb from "@/lib/db.ts";

type StableLayoutProps = {
  children: ReactNode;
  params: Promise<{ stableId: string; locale: string }>;
};

export default async function StableLayout({ children, params }: StableLayoutProps) {
  const { stableId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getStableView(stableId, userId);
      queryClient.setQueryData(queryKeys.stables.view(stableId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <StableLayoutChrome stableId={stableId}>{children}</StableLayoutChrome>
    </PreferHydrationBoundary>
  );
}
