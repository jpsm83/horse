/**
 * Loading placeholders for the profile route — used as Suspense fallback and mirrors
 * the layout of `profile-page-content.tsx`, `profile-form.tsx`, and `profile-deactivate-account.tsx`.
 */

import { FieldGroup, FieldSet } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";

function ProfileFieldSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

function ProfileMapSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-56 w-full rounded-lg sm:h-64 md:min-h-72" />
    </div>
  );
}

function ProfileDeactivateSkeleton() {
  return (
    <>
      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-32 pb-3" />
        <FieldGroup>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Skeleton className="h-10 w-full rounded-md sm:w-44" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        </FieldGroup>
      </FieldSet>
    </>
  );
}

export function ProfileFormSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8" aria-hidden>
      <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-start sm:gap-4">
        <Skeleton className="size-32 shrink-0 rounded-full" />
        <FieldSet className="min-w-0 w-full">
          <FieldGroup>
            <ProfileFieldSkeleton />
            <div className="grid gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/5" />
            </div>
          </FieldGroup>
        </FieldSet>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-[88px] w-full" />
      </div>

      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-32 pb-3" />
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-32 pb-3" />
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-32 pb-3" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
          <FieldGroup className="min-w-0">
            <div className="flex flex-col gap-5">
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
              <ProfileFieldSkeleton />
            </div>
          </FieldGroup>
          <div className="flex min-w-0 flex-col gap-5">
            <ProfileFieldSkeleton />
            <ProfileFieldSkeleton />
            <ProfileMapSkeleton />
          </div>
        </div>
      </FieldSet>

      <hr className="my-4" />

      <FieldSet>
        <Skeleton className="h-5 w-32 pb-3" />
        <FieldGroup>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Skeleton className="h-10 w-full rounded-md sm:w-48" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
        </FieldGroup>
      </FieldSet>

      <div className="flex">
        <Skeleton className="h-10 w-full sm:ms-auto sm:w-32" />
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="relative isolate z-0 flex min-h-0 flex-1 flex-col" aria-busy="true">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6 sm:gap-6 sm:py-12">
        <div className="space-y-2 pb-4" aria-hidden>
          <Skeleton className="h-8 w-48 sm:h-9" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
        <ProfileFormSkeleton />
        <ProfileDeactivateSkeleton />
      </div>
    </div>
  );
}
