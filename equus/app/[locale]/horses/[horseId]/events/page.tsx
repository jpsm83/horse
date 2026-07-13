import { Suspense } from "react";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseEventsPageContent } from "@/components/horses/horse-events-page-content.tsx";

type PageProps = { params: Promise<{ horseId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/events", "metadata.horseEvents");
}

export default async function HorseEventsPage({ params }: PageProps) {
  const { horseId } = await params;
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto p-6">Loading...</div>}>
      <HorseEventsPageContent horseId={horseId} />
    </Suspense>
  );
}
