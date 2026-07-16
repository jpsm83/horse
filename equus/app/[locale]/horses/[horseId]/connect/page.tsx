import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseConnectPageContent } from "@/components/horses/horse-connect-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/connect", "metadata.horseConnect");
}

export default async function HorseConnectPage({ params }: PageProps) {
  const { horseId } = await params;
  return <HorseConnectPageContent horseId={horseId} />;
}
