import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { Skeleton } from "@/components/ui/skeleton";

type PageProps = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  return generatePrivateMetadata(locale, "/profile", "metadata.profile");
}

const ProfilePage = dynamic(
  () =>
    import("@/components/profile/profile-page.tsx").then((m) => ({
      default: m.ProfilePage,
    })),
  { loading: () => <Skeleton className="h-[calc(100vh-5rem)] w-full rounded-none" /> },
);

export default function Page() {
  return <ProfilePage />;
}
