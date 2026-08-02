import type { Metadata } from "next";

import { FarrierProfileContent } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ farrierId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/farriers/[farrierId]/profile", "metadata.farrierProfile");
}

export default async function FarrierProfilePage({ params }: PageProps) {
  const { farrierId } = await params;
  return <FarrierProfileContent farrierId={farrierId} />;
}
