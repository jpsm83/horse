/**
 * User layout — RSC that pre-fetches the owner user view once per navigation.
 *
 * Seeds TanStack cache via HydrationBoundary so all sub-pages (hub, profile,
 * preferences, notifications, workplace, relationships, subscription) read from
 * the cache immediately with no loading waterfall.
 */

import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { getServerUserId } from "@/lib/auth/serverSession.ts";
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
    const data = await getUserView(userId, viewerUserId);
    queryClient.setQueryData(queryKeys.users.view(userId), data);
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {children}
    </HydrationBoundary>
  );
}
