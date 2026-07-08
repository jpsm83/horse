import { Suspense } from "react";
import { EntityPageContent } from "@/components/layout/entity-page-content.tsx";

export default function CreateStablePage() {
  return (
    <Suspense>
      <EntityPageContent entity="stables" showSignIn={false} />
    </Suspense>
  );
}
