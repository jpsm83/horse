import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

import { EntityPageContent } from "@/components/layout/entity-page-content.tsx";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/veterinaries/new", "metadata.veterinaries");
}

export default function CreatePage() {
  return <EntityPageContent entity="veterinaries" showSignIn={false} />;
}