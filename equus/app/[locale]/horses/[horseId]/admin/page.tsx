import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { AdminContent } from "./client";

type PageProps = {
  params: Promise<{ locale: string; horseId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/[horseId]/admin", "metadata.horseAdmin");
}

export default async function HorseAdminPage({ params }: PageProps) {
  const { horseId } = await params;
  return <AdminContent horseId={horseId} />;
}
