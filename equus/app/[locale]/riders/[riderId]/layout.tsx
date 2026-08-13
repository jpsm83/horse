/**
 * Rider layout — entity chrome only. View loads via useRiderView → GET /api/v1/riders/:id.
 */
import type { ReactNode } from "react";

import { RiderLayoutChrome } from "@/components/rider/rider-layout-chrome.tsx";

type RiderLayoutProps = {
  children: ReactNode;
  params: Promise<{ riderId: string; locale: string }>;
};

export default async function RiderLayout({ children, params }: RiderLayoutProps) {
  const { riderId } = await params;
  return <RiderLayoutChrome riderId={riderId}>{children}</RiderLayoutChrome>;
}
