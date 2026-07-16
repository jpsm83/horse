import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { Skeleton } from "@/components/ui/skeleton";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/horses/new", "metadata.horses");
}

const CreateHorsePage = dynamic(
  () =>
    import("@/components/horses/create-horse-page.tsx").then((m) => ({
      default: m.CreateHorsePage,
    })),
  { loading: () => <Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" /> },
);

export default function Page() {
  return <CreateHorsePage />;
}
