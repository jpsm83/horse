import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { CreateHorsePageSkeleton } from "@/components/horses/create-horse-page-skeleton.tsx";

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
  { loading: () => <CreateHorsePageSkeleton /> },
);

export default function Page() {
  return <CreateHorsePage />;
}
