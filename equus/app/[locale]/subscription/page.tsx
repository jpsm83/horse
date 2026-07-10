import { Suspense } from "react";
import type { Metadata } from "next";
import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { SubscriptionPageContent } from "@/components/billing/subscription-page-content.tsx";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/subscription", "metadata.subscription");
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-6">Loading...</div>}>
      <SubscriptionPageContent />
    </Suspense>
  );
}
