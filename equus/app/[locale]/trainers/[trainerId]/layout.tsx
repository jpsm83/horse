/**
 * Trainer layout — RSC that pre-fetches the role-aware trainer view once per
 * navigation.
 *
 * Uses PreferHydrationBoundary so a guest RSC seed cannot overwrite a richer
 * owner cache. getServerUserId falls back to the refresh cookie for identity;
 * if identity is unresolved but a refresh cookie exists, seeding is skipped.
 */

import { QueryClient, dehydrate } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { PreferHydrationBoundary } from "@/components/shared/prefer-hydration-boundary.tsx";
import { TrainerLayoutChrome } from "@/components/trainer/trainer-layout-chrome.tsx";
import { getServerUserId, hasRefreshCookie } from "@/lib/auth/serverSession.ts";
import { queryKeys } from "@/lib/api/queryKeys.ts";
import { getTrainerView } from "@/lib/services/trainerService.ts";
import connectDb from "@/lib/db.ts";

type TrainerLayoutProps = {
  children: ReactNode;
  params: Promise<{ trainerId: string; locale: string }>;
};

export default async function TrainerLayout({ children, params }: TrainerLayoutProps) {
  const { trainerId } = await params;
  const queryClient = new QueryClient();

  try {
    await connectDb();
    const userId = await getServerUserId();
    const canRecoverSession = !userId && (await hasRefreshCookie());
    if (!canRecoverSession) {
      const data = await getTrainerView(trainerId, userId);
      queryClient.setQueryData(queryKeys.trainers.view(trainerId), data);
    }
  } catch {
    // Non-fatal: the client will fetch on hydration if pre-fetch fails.
  }

  return (
    <PreferHydrationBoundary state={dehydrate(queryClient)}>
      <TrainerLayoutChrome trainerId={trainerId}>{children}</TrainerLayoutChrome>
    </PreferHydrationBoundary>
  );
}
