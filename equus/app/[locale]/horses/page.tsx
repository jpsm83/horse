import dynamic from "next/dynamic";

import { HorseListPageSkeleton } from "@/components/horses/horse-list-page-skeleton.tsx";

import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/horses", "metadata.horses");
}

const HorseListPage = dynamic(
  () =>
    import("@/components/horses/horse-list-page.tsx").then((m) => ({
      default: m.HorseListPage,
    })),
  { loading: () => <HorseListPageSkeleton /> },
);

export default function Page() {
  return <HorseListPage />;
}