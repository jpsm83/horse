/**
 * Loading placeholders for the create-horse route — mirrors form layout.
 */

import { FieldGroup, FieldSet } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

function HorseFieldSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function HorseTextareaSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}

function HorseFormSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-hidden>
      <FieldSet>
        <Skeleton className="h-5 w-32 pb-3" />
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
          </div>
          <HorseFieldSkeleton />
          <HorseTextareaSkeleton />
          <div className="grid gap-5 sm:grid-cols-2">
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-40 pb-3" />
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-36 pb-3" />
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
          </div>
          <HorseTextareaSkeleton />
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-24 pb-3" />
        <FieldGroup>
          <div className="flex items-center gap-4">
            <Skeleton className="size-24 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="aspect-square rounded-lg" />
          </div>
          <HorseTextareaSkeleton />
          <HorseTextareaSkeleton />
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-44 pb-3" />
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <HorseFieldSkeleton />
            <HorseFieldSkeleton />
          </div>
        </FieldGroup>
      </FieldSet>

      <div className="flex">
        <Skeleton className="h-10 w-full sm:ms-auto sm:w-32" />
      </div>
    </div>
  );
}

export function CreateHorsePageSkeleton() {
  return (
    <div
      className="relative isolate z-0 flex min-h-0 flex-1 flex-col"
      aria-busy="true"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:gap-6 sm:py-12">
        <div className="space-y-2 pb-4" aria-hidden>
          <Skeleton className="h-8 w-48 sm:h-9" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <HorseFormSkeleton />
      </div>
    </div>
  );
}
