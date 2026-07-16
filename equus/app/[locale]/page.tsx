import { Suspense } from "react";

import { HomePage } from "@/components/home/home-page.tsx";
import { Skeleton } from "@/components/ui/skeleton";
import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "", "metadata.home");
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" />}>
      <HomePage />
    </Suspense>
  );
}
