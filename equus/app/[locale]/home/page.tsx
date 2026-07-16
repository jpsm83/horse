import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

import type { Metadata } from "next";
import { generatePublicMetadata } from "@/lib/seo/metadata-factory.ts";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePublicMetadata(locale, "/home", "metadata.homeDashboard");
}

const UserHomePage = dynamic(
  () =>
    import("@/components/home/user-home-page.tsx").then((m) => ({
      default: m.UserHomePage,
    })),
  { loading: () => <Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" /> },
);

export default function Page() {
  return <UserHomePage />;
}
