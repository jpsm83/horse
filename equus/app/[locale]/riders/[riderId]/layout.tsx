/**
 * Rider layout — RSC that pre-fetches the role-aware rider view once per
 * navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache. getServerUserId falls back to the refresh cookie for identity;
 * if identity is unresolved but a refresh cookie exists, seeding is skipped.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { RiderLayoutChrome } from "@/components/rider/rider-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getRiderView } from "@/lib/services/riderService.ts";
import connectDb from "@/lib/db.ts";

type RiderLayoutProps = {
  children: ReactNode;
  params: Promise<{ riderId: string; locale: string }>;
};

export default async function RiderLayout({ children, params }: RiderLayoutProps) {
  const { riderId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getRiderView(riderId, userId);
      queryClient.setQueryData(queryKeys.riders.view(riderId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <RiderLayoutChrome riderId={riderId}>{children}</RiderLayoutChrome>
    </PreferHydrationBoundary>
  );
}
