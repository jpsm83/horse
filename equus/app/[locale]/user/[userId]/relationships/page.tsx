import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { RelationshipsContent } from "./client";

type PageProps = { params: Promise<{ userId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/user/[userId]/relationships", "metadata.relationships");
}

export default async function RelationshipsPage({ params }: PageProps) {
  const { userId } = await params;
  return <RelationshipsContent userId={userId} />;
}
