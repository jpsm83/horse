import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { generatePrivateMetadata } from "@/lib/seo/metadata-factory.ts";
import { ProfilePageSkeleton } from "@/components/profile/profile-page-skeleton.tsx";

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
  { loading: () => <ProfilePageSkeleton /> },
);

export default function Page() {
  return <ProfilePage />;
}
