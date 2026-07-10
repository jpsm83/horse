import type { Metadata } from "next";
import { Suspense } from "react";

import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { EntityPageContent } from "@/components/layout/entity-page-content.tsx";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/stables/new", "metadata.stables");
}

export default function CreateStablePage() {
  return (
    <Suspense>
      <EntityPageContent entity="stables" showSignIn={false} />
    </Suspense>
  );
}
