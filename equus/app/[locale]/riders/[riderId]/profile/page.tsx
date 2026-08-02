import type { Metadata } from "next";

import { RiderProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ riderId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/riders/[riderId]/profile", "metadata.riderProfile");
}

export default async function RiderProfilePage({ params }: PageProps) {
  const { riderId } = await params;
  return <RiderProfileContent riderId={riderId} />;
}
