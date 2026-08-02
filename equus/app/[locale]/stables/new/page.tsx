import type { Metadata } from "next";

import { StableCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/stables/new", "metadata.stableCreate");
}

export default function CreateStablePage() {
  return <StableCreateClient />;
}
