/**
 * Riding club layout — RSC that pre-fetches the role-aware riding club view once
 * per navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache. getServerUserId falls back to the refresh cookie for identity;
 * if identity is unresolved but a refresh cookie exists, seeding is skipped.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { RidingClubLayoutChrome } from "@/components/riding-club/riding-club-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getRidingClubView } from "@/lib/services/ridingClubService.ts";
import connectDb from "@/lib/db.ts";

type RidingClubLayoutProps = {
  children: ReactNode;
  params: Promise<{ clubId: string; locale: string }>;
};

export default async function RidingClubLayout({ children, params }: RidingClubLayoutProps) {
  const { clubId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getRidingClubView(clubId, userId);
      queryClient.setQueryData(queryKeys.ridingClubs.view(clubId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <RidingClubLayoutChrome clubId={clubId}>{children}</RidingClubLayoutChrome>
    </PreferHydrationBoundary>
  );
}
