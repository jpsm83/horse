import type { Metadata } from "next";

import { StableAdminContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ stableId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/stables/[stableId]/admin", "metadata.stableAdmin");
}

export default async function StableAdminPage({ params }: PageProps) {
  const { stableId } = await params;
  return <StableAdminContent stableId={stableId} />;
}
