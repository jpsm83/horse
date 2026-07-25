import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { HubContent } from "./client";

type PageProps = { params: Promise<{ userId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/user/[userId]", "metadata.userHub");
}

export default async function UserHubPage({ params }: PageProps) {
  const { userId } = await params;
  return <HubContent userId={userId} />;
}
