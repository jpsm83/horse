/**
 * Veterinary layout — entity chrome only. View loads via useVeterinaryView → GET /api/v1/veterinaries/:id.
 */
import type { ReactNode } from "react";

import { VeterinaryLayoutChrome } from "@/components/veterinary/veterinary-layout-chrome.tsx";

type VeterinaryLayoutProps = {
  children: ReactNode;
  params: Promise<{ veterinaryId: string; locale: string }>;
};

export default async function VeterinaryLayout({ children, params }: VeterinaryLayoutProps) {
  const { veterinaryId } = await params;
  return (
    <VeterinaryLayoutChrome veterinaryId={veterinaryId}>{children}</VeterinaryLayoutChrome>
  );
}
