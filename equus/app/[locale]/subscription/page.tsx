import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";
import { SubscriptionPageContent } from "@/components/billing/subscription-page-content.tsx";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/subscription", "metadata.subscription");
}

export default function SubscriptionPage() {
  return <SubscriptionPageContent />;
}
