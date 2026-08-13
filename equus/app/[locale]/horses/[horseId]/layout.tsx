/**
 * Horse layout — entity chrome only. Role-aware view loads on the client via
 * useHorseView → GET /api/v1/horses/:id.
 */
import type { ReactNode } from "react";

import { HorseLayoutChrome } from "@/components/horses/horse-layout-chrome.tsx";

type HorseLayoutProps = {
  children: ReactNode;
  params: Promise<{ horseId: string; locale: string }>;
};

export default async function HorseLayout({ children, params }: HorseLayoutProps) {
  const { horseId } = await params;
  return <HorseLayoutChrome horseId={horseId}>{children}</HorseLayoutChrome>;
}
