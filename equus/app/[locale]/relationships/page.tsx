import { Suspense } from "react";
import { RelationshipsContent } from "@/components/invites/relationships-content.tsx";
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/relationships", "metadata.relationships");
}

export default function RelationshipsPage() {
  return (
    <Suspense fallback={null}>
      <RelationshipsContent />
    </Suspense>
  );
}
