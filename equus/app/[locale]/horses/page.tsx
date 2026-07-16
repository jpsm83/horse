import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";
import { HorseListPage } from "@/components/horses/horse-list-page.tsx";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/horses", "metadata.horses");
}

export default function Page() {
  return <HorseListPage />;
}