import dynamic from "next/dynamic";

import { CreateHorsePageSkeleton } from "@/components/horses/create-horse-page-skeleton.tsx";

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
