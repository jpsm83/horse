/**
 * VeterinaryProfileContent — owner profile edit tab
 * (`/veterinaries/[veterinaryId]/profile`).
 *
 * Wrapped in VeterinaryPageShell (gated on the view DTO's `isOwner` flag).
 * Deferred RHF form (parent-owned `useForm` + one Save) composed of identity and
 * contact sections persisting via `PATCH /api/v1/veterinaries/:id`, plus an
 * immediate-autosave visibility section (`isPublic` / `acceptsNewPatients`).
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { VeterinaryContactSection } from "@/components/veterinary/profile/veterinary-contact-section.tsx";
import { VeterinaryIdentitySection } from "@/components/veterinary/profile/veterinary-identity-section.tsx";
import { VeterinaryVisibilitySection } from "@/components/veterinary/profile/veterinary-visibility-section.tsx";
import { VeterinaryPageShell } from "@/components/veterinary/veterinary-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateVeterinaryProfile } from "@/hooks/queries/useVeterinaryProfile.ts";
import {
  veterinaryProfileFormSchema,
  type VeterinaryProfileFormValues,
} from "@/lib/validations/veterinaryForms.ts";
import type { VeterinaryViewDto } from "@/lib/services/veterinaryService.ts";

const emptyValues: VeterinaryProfileFormValues = {
  practiceName: "",
  description: "",
  email: "",
  phoneNumber: "",
  emergencyPhoneNumber: "",
  serviceAreaKm: undefined,
  emergencyAvailability: false,
  address: { country: "", city: "", state: "", street: "", postCode: "", buildingNumber: "" },
};

export function VeterinaryProfileContent({ veterinaryId }: { veterinaryId: string }) {
  return (
    <VeterinaryPageShell veterinaryId={veterinaryId}>
      {({ veterinary }) => (
        <div className="flex flex-col gap-6">
          <ProfileForm veterinaryId={veterinaryId} initial={veterinary} />
          <VisibilitySection veterinary={veterinary} />
        </div>
      )}
    </VeterinaryPageShell>
  );
}

function VisibilitySection({ veterinary }: { veterinary: VeterinaryViewDto }) {
  const t = useTranslations("veterinary.profile");

  return (
    <Section title={t("visibilitySection")}>
      <SectionErrorBoundary message={t("loadFailed")}>
        <VeterinaryVisibilitySection veterinary={veterinary} />
      </SectionErrorBoundary>
    </Section>
  );
}

function ProfileForm({
  veterinaryId,
  initial,
}: {
  veterinaryId: string;
  initial: VeterinaryViewDto;
}) {
  const t = useTranslations("veterinary.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateVeterinaryProfile(veterinaryId);

  const form = useForm<VeterinaryProfileFormValues>({
    resolver: zodResolver(veterinaryProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded veterinary id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      practiceName: initial.practiceName ?? "",
      description: initial.description ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      emergencyPhoneNumber: initial.emergencyPhoneNumber ?? "",
      serviceAreaKm: initial.serviceAreaKm,
      emergencyAvailability: initial.emergencyAvailability ?? false,
    });
  }

  const isSubmitting = form.formState.isSubmitting;

  async function onSave(values: VeterinaryProfileFormValues) {
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
            <VeterinaryIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <VeterinaryContactSection control={form.control} />
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
