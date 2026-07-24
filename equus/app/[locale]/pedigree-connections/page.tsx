import { Suspense } from "react";
import { PedigreeConnectionsContent } from "@/components/invites/pedigree-connections-content.tsx";
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/pedigree-connections", "metadata.pedigreeConnections");
}

export default function PedigreeConnectionsPage() {
  return (
    <Suspense fallback={null}>
      <PedigreeConnectionsContent />
    </Suspense>
  );
}
