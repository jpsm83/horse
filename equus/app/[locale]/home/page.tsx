import dynamic from "next/dynamic";

import { UserHomePageSkeleton } from "@/components/home/user-home-page-skeleton.tsx";

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
