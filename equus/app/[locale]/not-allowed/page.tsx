import { Suspense } from "react";
import { NotAllowedContent } from "@/components/status/not-allowed-content.tsx";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/not-allowed", "metadata.notAllowed");
}

export default function NotAllowedPage() {
  return (
    <Suspense fallback={null}>
      <NotAllowedContent />
    </Suspense>
  );
}
