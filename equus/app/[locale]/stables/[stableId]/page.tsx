import type { Metadata } from "next";

import { StableHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ stableId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/stables/[stableId]", "metadata.stableHub");
}

export default async function StableHubPage({ params }: PageProps) {
  const { stableId } = await params;
  return <StableHubContent stableId={stableId} />;
}
