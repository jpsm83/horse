import dynamic from "next/dynamic";

import { HorseListPageSkeleton } from "@/components/horses/horse-list-page-skeleton.tsx";

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