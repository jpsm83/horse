/**
 * Transport layout — entity chrome only. View loads via useTransportView → GET /api/v1/transports/:id.
 */
import type { ReactNode } from "react";

import { TransportLayoutChrome } from "@/components/transport/transport-layout-chrome.tsx";

type TransportLayoutProps = {
  children: ReactNode;
  params: Promise<{ transportId: string; locale: string }>;
};

export default async function TransportLayout({ children, params }: TransportLayoutProps) {
  const { transportId } = await params;
  return <TransportLayoutChrome transportId={transportId}>{children}</TransportLayoutChrome>;
}
