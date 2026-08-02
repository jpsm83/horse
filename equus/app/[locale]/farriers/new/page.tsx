import type { Metadata } from "next";

import { FarrierCreateClient } from "./client";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/farriers/new", "metadata.farrierCreate");
}

export default function CreateFarrierPage() {
  return <FarrierCreateClient />;
}
