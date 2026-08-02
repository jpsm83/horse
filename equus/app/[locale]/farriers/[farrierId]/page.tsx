import type { Metadata } from "next";

import { FarrierHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ farrierId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/farriers/[farrierId]", "metadata.farrierHub");
}

export default async function FarrierHubPage({ params }: PageProps) {
  const { farrierId } = await params;
  return <FarrierHubContent farrierId={farrierId} />;
}
