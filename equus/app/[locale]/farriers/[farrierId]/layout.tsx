/**
 * Farrier layout — entity chrome only. View loads via useFarrierView → GET /api/v1/farriers/:id.
 */
import type { ReactNode } from "react";

import { FarrierLayoutChrome } from "@/components/farrier/farrier-layout-chrome.tsx";

type FarrierLayoutProps = {
  children: ReactNode;
  params: Promise<{ farrierId: string; locale: string }>;
};

export default async function FarrierLayout({ children, params }: FarrierLayoutProps) {
  const { farrierId } = await params;
  return <FarrierLayoutChrome farrierId={farrierId}>{children}</FarrierLayoutChrome>;
}
