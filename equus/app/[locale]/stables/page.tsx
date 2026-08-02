import type { Metadata } from "next";

import { StableListClient } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/stables", "metadata.stables");
}

export default function StablesPage() {
  return <StableListClient />;
}
