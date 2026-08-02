/**
 * CoachProfileContent — owner profile edit tab (`/coaches/[coachId]/profile`).
 *
 * Deferred RHF form (parent-owned `useForm` + one Save) composed of identity,
 * contact, and visibility sections. Persists identity/contact via
 * `PATCH /api/v1/coaches/:id`; visibility toggles autosave via
 * `PATCH /api/v1/coaches/:id/discovery`.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { CoachContactSection } from "@/components/coach/profile/coach-contact-section.tsx";
import { CoachIdentitySection } from "@/components/coach/profile/coach-identity-section.tsx";
import { CoachPageShell } from "@/components/coach/coach-page-shell.tsx";
import { CoachVisibilitySection } from "@/components/coach/profile/coach-visibility-section.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateCoachProfile } from "@/hooks/queries/useCoachProfile.ts";
import {
  coachProfileFormSchema,
  type CoachProfileFormValues,
} from "@/lib/validations/coachForms.ts";
import type { CoachViewDto } from "@/lib/services/coachService.ts";

const emptyValues: CoachProfileFormValues = {
  displayName: "",
  bio: "",
  email: "",
  phoneNumber: "",
  disciplines: [],
  competitionLevels: "",
  preparationServices: "",
  experienceYears: "",
};

export function CoachProfileContent({ coachId }: { coachId: string }) {
  return (
    <CoachPageShell coachId={coachId} requireOwnership>
      {({ coach }) => <ProfileForm coachId={coachId} initial={coach} />}
    </CoachPageShell>
  );
}

function ProfileForm({
  coachId,
  initial,
}: {
  coachId: string;
  initial: CoachViewDto;
}) {
  const t = useTranslations("coach.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateCoachProfile(coachId);

  const form = useForm<CoachProfileFormValues>({
    resolver: zodResolver(coachProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded coach id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      displayName: initial.displayName ?? "",
      bio: initial.bio ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      disciplines: (initial.disciplines ?? []) as CoachProfileFormValues["disciplines"],
      competitionLevels: (initial.competitionLevels ?? []).join(", "),
      preparationServices: (initial.preparationServices ?? []).join(", "),
      experienceYears: initial.experienceYears != null ? String(initial.experienceYears) : "",
    });
  }

  const isSubmitting = form.formState.isSubmitting;

  async function onSave(values: CoachProfileFormValues) {
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
            <CoachIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <CoachContactSection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <div className="flex">
          <Button type="submit" className="w-full sm:ms-auto sm:w-auto" disabled={isSubmitting}>
            {isSubmitting ? t("saving") : t("save")}
          </Button>
        </div>
      </form>

      <Section title={t("visibilitySection")}>
        <SectionErrorBoundary message={t("loadFailed")}>
          <CoachVisibilitySection coach={initial} />
        </SectionErrorBoundary>
      </Section>
    </div>
  );
}
