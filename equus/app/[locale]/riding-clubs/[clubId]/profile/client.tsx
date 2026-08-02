/**
 * RidingClubProfileContent — owner profile edit tab
 * (`/riding-clubs/[clubId]/profile`).
 *
 * Deferred RHF form (parent-owned `useForm` + one Save) composed of identity,
 * contact, and address sections. Persists via `PATCH /api/v1/riding-clubs/:id`.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { RidingClubAddressSection } from "@/components/riding-club/profile/riding-club-address-section.tsx";
import { RidingClubContactSection } from "@/components/riding-club/profile/riding-club-contact-section.tsx";
import { RidingClubIdentitySection } from "@/components/riding-club/profile/riding-club-identity-section.tsx";
import { RidingClubPageShell } from "@/components/riding-club/riding-club-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateRidingClubProfile } from "@/hooks/queries/useRidingClubProfile.ts";
import {
  ridingClubProfileFormSchema,
  type RidingClubProfileFormValues,
} from "@/lib/validations/ridingClubForms.ts";
import type { RidingClubViewDto } from "@/lib/services/ridingClubService.ts";

const emptyValues: RidingClubProfileFormValues = {
  clubName: "",
  description: "",
  email: "",
  phoneNumber: "",
  disciplines: [],
  facilities: "",
  membershipInfo: "",
  membershipFee: "",
  address: { country: "", city: "", state: "", street: "", postCode: "", buildingNumber: "" },
};

export function RidingClubProfileContent({ clubId }: { clubId: string }) {
  return (
    <RidingClubPageShell clubId={clubId} requireOwnership>
      {({ ridingClub }) => <ProfileForm clubId={clubId} initial={ridingClub} />}
    </RidingClubPageShell>
  );
}

function ProfileForm({
  clubId,
  initial,
}: {
  clubId: string;
  initial: RidingClubViewDto;
}) {
  const t = useTranslations("ridingClub.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateRidingClubProfile(clubId);

  const form = useForm<RidingClubProfileFormValues>({
    resolver: zodResolver(ridingClubProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded club id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      clubName: initial.clubName ?? "",
      description: initial.description ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      disciplines: (initial.disciplines ?? []) as RidingClubProfileFormValues["disciplines"],
      facilities: (initial.facilities ?? []).join(", "),
      membershipInfo: initial.membershipInfo ?? "",
      membershipFee: initial.membershipFee != null ? String(initial.membershipFee) : "",
      address: {
        country: initial.address?.country ?? "",
        city: initial.address?.city ?? "",
        state: initial.address?.state ?? "",
        street: initial.address?.street ?? "",
        postCode: initial.address?.postCode ?? "",
        buildingNumber: initial.address?.buildingNumber ?? "",
      },
    });
  }

  const isSubmitting = form.formState.isSubmitting;

  async function onSave(values: RidingClubProfileFormValues) {
    try {
      await updateProfile.mutateAsync(values);
      toast.success(t("saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <form className="flex flex-col gap-6" onSubmit={form.handleSubmit(onSave)} noValidate>
        <Section title={t("identitySection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <RidingClubIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <RidingClubContactSection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("addressSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <RidingClubAddressSection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <div className="flex">
          <Button type="submit" className="w-full sm:ms-auto sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
