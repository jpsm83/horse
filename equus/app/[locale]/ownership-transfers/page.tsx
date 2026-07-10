import { Suspense } from "react";
import { OwnershipTransfersContent } from "@/components/invites/ownership-transfers-content.tsx";
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/ownership-transfers", "metadata.ownershipTransfers");
}

export default function OwnershipTransfersPage() {
  return (
    <Suspense fallback={null}>
      <OwnershipTransfersContent />
    </Suspense>
  );
}
