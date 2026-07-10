import { EntityPageContent } from "@/components/layout/entity-page-content.tsx";
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/veterinaries", "metadata.veterinaries");
}

export default function EntityPage() {
  return <EntityPageContent entity="veterinaries" owned={true} />;
}