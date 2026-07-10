import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

import { EntityPageContent } from "@/components/layout/entity-page-content.tsx";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/riding-clubs/new", "metadata.ridingClubs");
}

export default function CreatePage() {
  return <EntityPageContent entity="riding-clubs" showSignIn={false} />;
}