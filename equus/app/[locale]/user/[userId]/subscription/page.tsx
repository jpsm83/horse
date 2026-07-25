import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { SubscriptionContent } from "./client";

type PageProps = { params: Promise<{ userId: string; locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/user/[userId]/subscription", "metadata.subscription");
}

export default async function SubscriptionPage({ params }: PageProps) {
  const { userId } = await params;
  return <SubscriptionContent userId={userId} />;
}
