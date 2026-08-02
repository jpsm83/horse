import type { Metadata } from "next";

import { VeterinaryHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ veterinaryId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(
    locale,
    "/veterinaries/[veterinaryId]",
    "metadata.veterinaryHub",
  );
}

export default async function VeterinaryHubPage({ params }: PageProps) {
  const { veterinaryId } = await params;
  return <VeterinaryHubContent veterinaryId={veterinaryId} />;
}
