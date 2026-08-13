/**
 * Groom layout — entity chrome only. View loads via useGroomView → GET /api/v1/grooms/:id.
 */
import type { ReactNode } from "react";

import { GroomLayoutChrome } from "@/components/groom/groom-layout-chrome.tsx";

type GroomLayoutProps = {
  children: ReactNode;
  params: Promise<{ groomId: string; locale: string }>;
};

export default async function GroomLayout({ children, params }: GroomLayoutProps) {
  const { groomId } = await params;
  return <GroomLayoutChrome groomId={groomId}>{children}</GroomLayoutChrome>;
}
