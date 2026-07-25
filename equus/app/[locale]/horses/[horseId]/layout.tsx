/**
 * Horse layout — RSC that pre-fetches the role-aware horse view once per navigation.
 *
 * Uses TanStack Query HydrationBoundary to seed the client cache with server-fetched
 * data so all horse tabs read from the cache immediately with no loading waterfall.
 */

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getServerUserId } from "@/lib/auth/serverSession.ts";
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
    const data = await getHorseView(horseId, userId);
    queryClient.setQueryData(queryKeys.horses.view(horseId), data);
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails (404, inactive, etc.)
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
