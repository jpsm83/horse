/**
 * BreederProfileContent — owner profile edit tab (`/breeders/[breederId]/profile`).
 *
 * Deferred RHF form (parent-owned `useForm` + one Save) composed of identity,
 * contact, and address sections. Persists via `PATCH /api/v1/breeders/:id`.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { BreederAddressSection } from "@/components/breeder/profile/breeder-address-section.tsx";
import { BreederContactSection } from "@/components/breeder/profile/breeder-contact-section.tsx";
import { BreederIdentitySection } from "@/components/breeder/profile/breeder-identity-section.tsx";
import { BreederPageShell } from "@/components/breeder/breeder-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateBreederProfile } from "@/hooks/queries/useBreederProfile.ts";
import {
  breederProfileFormSchema,
  type BreederProfileFormValues,
} from "@/lib/validations/breederForms.ts";
import type { BreederViewDto } from "@/lib/services/breederService.ts";

const emptyValues: BreederProfileFormValues = {
  operationName: "",
  description: "",
  email: "",
  phoneNumber: "",
  disciplines: [],
  bloodlines: "",
  address: { country: "", city: "", state: "", street: "", postCode: "", buildingNumber: "" },
};

export function BreederProfileContent({ breederId }: { breederId: string }) {
  return (
    <BreederPageShell breederId={breederId} requireOwnership>
      {({ breeder }) => <ProfileForm breederId={breederId} initial={breeder} />}
    </BreederPageShell>
  );
}

function ProfileForm({
  breederId,
  initial,
}: {
  breederId: string;
  initial: BreederViewDto;
}) {
  const t = useTranslations("breeder.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateBreederProfile(breederId);

  const form = useForm<BreederProfileFormValues>({
    resolver: zodResolver(breederProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded breeder id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      operationName: initial.operationName ?? "",
      description: initial.description ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      disciplines: (initial.disciplines ?? []) as BreederProfileFormValues["disciplines"],
      bloodlines: (initial.bloodlines ?? []).join(", "),
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

  async function onSave(values: BreederProfileFormValues) {
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
            <BreederIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <BreederContactSection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("addressSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <BreederAddressSection control={form.control} />
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
