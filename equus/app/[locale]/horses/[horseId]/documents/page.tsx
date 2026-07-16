import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseDocumentsPageContent } from "@/components/horses/horse-documents-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/documents", "metadata.horseDocuments");
}

export default async function HorseDocumentsPage({ params }: PageProps) {
  const { horseId } = await params;
  return <HorseDocumentsPageContent horseId={horseId} />;
}
