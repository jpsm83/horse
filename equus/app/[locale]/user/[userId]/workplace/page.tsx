import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { WorkplaceContent } from "./client";

type PageProps = { params: Promise<{ userId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/user/[userId]/workplace", "metadata.workplace");
}

export default async function WorkplacePage({ params }: PageProps) {
  const { userId } = await params;
  return <WorkplaceContent userId={userId} />;
}
