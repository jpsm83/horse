import type { Metadata } from "next";

import { GroomHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ groomId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/groomers/[groomId]", "metadata.groomHub");
}

export default async function GroomHubPage({ params }: PageProps) {
  const { groomId } = await params;
  return <GroomHubContent groomId={groomId} />;
}
