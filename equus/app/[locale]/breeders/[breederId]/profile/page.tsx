import type { Metadata } from "next";

import { BreederProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ breederId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/breeders/[breederId]/profile", "metadata.breederProfile");
}

export default async function BreederProfilePage({ params }: PageProps) {
  const { breederId } = await params;
  return <BreederProfileContent breederId={breederId} />;
}
