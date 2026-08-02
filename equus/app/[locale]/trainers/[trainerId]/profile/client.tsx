/**
 * TrainerProfileContent — owner profile edit tab (`/trainers/[trainerId]/profile`).
 *
 * Wrapped in TrainerPageShell (gated on the view DTO's `isOwner` flag).
 * Deferred RHF form (parent-owned `useForm` + one Save) composed of identity and
 * contact sections persisting via `PATCH /api/v1/trainers/:id`, plus an
 * immediate-autosave visibility section (`isPublic` / `acceptsNewClients`).
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { TrainerContactSection } from "@/components/trainer/profile/trainer-contact-section.tsx";
import { TrainerIdentitySection } from "@/components/trainer/profile/trainer-identity-section.tsx";
import { TrainerVisibilitySection } from "@/components/trainer/profile/trainer-visibility-section.tsx";
import { TrainerPageShell } from "@/components/trainer/trainer-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateTrainerProfile } from "@/hooks/queries/useTrainerProfile.ts";
import {
  trainerProfileFormSchema,
  type TrainerProfileFormValues,
} from "@/lib/validations/trainerForms.ts";
import type { TrainerViewDto } from "@/lib/services/trainerService.ts";

const emptyValues: TrainerProfileFormValues = {
  displayName: "",
  bio: "",
  email: "",
  phoneNumber: "",
  legalName: "",
  specialties: [],
  experienceYears: undefined,
  address: { country: "", city: "", state: "", street: "", postCode: "", buildingNumber: "" },
};

export function TrainerProfileContent({ trainerId }: { trainerId: string }) {
  return (
    <TrainerPageShell trainerId={trainerId}>
      {({ trainer }) => (
        <div className="flex flex-col gap-6">
          <ProfileForm trainerId={trainerId} initial={trainer} />
          <VisibilitySection trainer={trainer} />
        </div>
      )}
    </TrainerPageShell>
  );
}

function VisibilitySection({ trainer }: { trainer: TrainerViewDto }) {
  const t = useTranslations("trainer.profile");

  return (
    <Section title={t("visibilitySection")}>
      <SectionErrorBoundary message={t("loadFailed")}>
        <TrainerVisibilitySection trainer={trainer} />
      </SectionErrorBoundary>
    </Section>
  );
}

function ProfileForm({
  trainerId,
  initial,
}: {
  trainerId: string;
  initial: TrainerViewDto;
}) {
  const t = useTranslations("trainer.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateTrainerProfile(trainerId);

  const form = useForm<TrainerProfileFormValues>({
    resolver: zodResolver(trainerProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded trainer id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      displayName: initial.displayName ?? "",
      bio: initial.bio ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      legalName: initial.legalName ?? "",
      specialties: (initial.specialties ?? []) as TrainerProfileFormValues["specialties"],
      experienceYears: initial.experienceYears,
    });
  }

  const isSubmitting = form.formState.isSubmitting;

  async function onSave(values: TrainerProfileFormValues) {
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
            <TrainerIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <TrainerContactSection control={form.control} />
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
