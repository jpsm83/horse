import type { Metadata } from "next";

import { BreederHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ breederId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/breeders/[breederId]", "metadata.breederHub");
}

export default async function BreederHubPage({ params }: PageProps) {
  const { breederId } = await params;
  return <BreederHubContent breederId={breederId} />;
}
