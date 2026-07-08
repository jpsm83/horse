import dynamic from "next/dynamic";

import { ProfilePageSkeleton } from "@/components/profile/profile-page-skeleton.tsx";

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
