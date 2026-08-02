import type { Metadata } from "next";

import { TransportHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ transportId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/transport/[transportId]", "metadata.transportHub");
}

export default async function TransportHubPage({ params }: PageProps) {
  const { transportId } = await params;
  return <TransportHubContent transportId={transportId} />;
}
