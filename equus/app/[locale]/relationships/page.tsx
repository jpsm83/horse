import type { Metadata } from "next";

import { RelationshipsClient } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/relationships", "metadata.relationships");
}

export default function RelationshipsPage() {
  return <RelationshipsClient />;
}
