import { Suspense } from "react";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseMediaPageContent } from "@/components/horses/horse-media-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/media", "metadata.horseMedia");
}

export default async function HorseMediaPage({ params }: PageProps) {
  const { horseId } = await params;
  return (
    <Suspense fallback={<div className=" mx-auto p-6">Loading...</div>}>
      <HorseMediaPageContent horseId={horseId} />
    </Suspense>
  );
}
