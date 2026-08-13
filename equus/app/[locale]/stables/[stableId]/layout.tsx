/**
 * Stable layout — entity chrome only. View loads via useStableView → GET /api/v1/stables/:id.
 */
import type { ReactNode } from "react";

import { StableLayoutChrome } from "@/components/stable/stable-layout-chrome.tsx";

type StableLayoutProps = {
  children: ReactNode;
  params: Promise<{ stableId: string; locale: string }>;
};

export default async function StableLayout({ children, params }: StableLayoutProps) {
  const { stableId } = await params;
  return <StableLayoutChrome stableId={stableId}>{children}</StableLayoutChrome>;
}
