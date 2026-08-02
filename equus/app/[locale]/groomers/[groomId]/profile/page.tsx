import type { Metadata } from "next";

import { GroomProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ groomId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/groomers/[groomId]/profile", "metadata.groomProfile");
}

export default async function GroomProfilePage({ params }: PageProps) {
  const { groomId } = await params;
  return <GroomProfileContent groomId={groomId} />;
}
