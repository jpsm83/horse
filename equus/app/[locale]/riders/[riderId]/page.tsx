import type { Metadata } from "next";

import { RiderHubContent } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ riderId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/riders/[riderId]", "metadata.riderHub");
}

export default async function RiderHubPage({ params }: PageProps) {
  const { riderId } = await params;
  return <RiderHubContent riderId={riderId} />;
}
