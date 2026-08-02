import type { Metadata } from "next";

import { RiderListClient } from "./client";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/riders", "metadata.riders");
}

export default function RidersPage() {
  return <RiderListClient />;
}
