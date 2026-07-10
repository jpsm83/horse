import dynamic from "next/dynamic";

import { UserHomePageSkeleton } from "@/components/home/user-home-page-skeleton.tsx";

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
  { loading: () => <UserHomePageSkeleton /> },
);

export default function Page() {
  return <UserHomePage />;
}
