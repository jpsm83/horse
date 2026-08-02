import type { Metadata } from "next";

import { TransportProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ transportId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(
    locale,
    "/transport/[transportId]/profile",
    "metadata.transportProfile",
  );
}

export default async function TransportProfilePage({ params }: PageProps) {
  const { transportId } = await params;
  return <TransportProfileContent transportId={transportId} />;
}
