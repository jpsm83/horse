import type { Metadata } from "next";

import { TransportAdminContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ transportId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(
    locale,
    "/transport/[transportId]/admin",
    "metadata.transportAdmin",
  );
}

export default async function TransportAdminPage({ params }: PageProps) {
  const { transportId } = await params;
  return <TransportAdminContent transportId={transportId} />;
}
