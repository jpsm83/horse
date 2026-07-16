import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseEditPageContent } from "@/components/horses/horse-edit-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/edit", "metadata.horseEdit");
}

export default async function HorseEditPage({ params }: PageProps) {
  const { horseId } = await params;
  return <HorseEditPageContent horseId={horseId} />;
}
