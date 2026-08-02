import type { Metadata } from "next";

import { StableProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ stableId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/stables/[stableId]/profile", "metadata.stableProfile");
}

export default async function StableProfilePage({ params }: PageProps) {
  const { stableId } = await params;
  return <StableProfileContent stableId={stableId} />;
}
