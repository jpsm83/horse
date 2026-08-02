import type { Metadata } from "next";

import { VeterinaryProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ veterinaryId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(
    locale,
    "/veterinaries/[veterinaryId]/profile",
    "metadata.veterinaryProfile",
  );
}

export default async function VeterinaryProfilePage({ params }: PageProps) {
  const { veterinaryId } = await params;
  return <VeterinaryProfileContent veterinaryId={veterinaryId} />;
}
