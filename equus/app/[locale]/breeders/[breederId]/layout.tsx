/**
 * Breeder layout — entity chrome only. View loads via useBreederView → GET /api/v1/breeders/:id.
 */
import type { ReactNode } from "react";

import { BreederLayoutChrome } from "@/components/breeder/breeder-layout-chrome.tsx";

type BreederLayoutProps = {
  children: ReactNode;
  params: Promise<{ breederId: string; locale: string }>;
};

export default async function BreederLayout({ children, params }: BreederLayoutProps) {
  const { breederId } = await params;
  return <BreederLayoutChrome breederId={breederId}>{children}</BreederLayoutChrome>;
}
