/**
 * RiderProfileContent — owner profile edit tab (`/riders/[riderId]/profile`).
 *
 * Deferred RHF form (parent-owned `useForm` + one Save) composed of identity,
 * contact, and visibility sections. Persists identity/contact via
 * `PATCH /api/v1/riders/:id`; visibility toggles autosave via
 * `PATCH /api/v1/riders/:id/discovery`.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { RiderContactSection } from "@/components/rider/profile/rider-contact-section.tsx";
import { RiderIdentitySection } from "@/components/rider/profile/rider-identity-section.tsx";
import { RiderPageShell } from "@/components/rider/rider-page-shell.tsx";
import { RiderVisibilitySection } from "@/components/rider/profile/rider-visibility-section.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateRiderProfile } from "@/hooks/queries/useRiderProfile.ts";
import {
  riderProfileFormSchema,
  type RiderProfileFormValues,
} from "@/lib/validations/riderForms.ts";
import type { RiderViewDto } from "@/lib/services/riderService.ts";

const emptyValues: RiderProfileFormValues = {
  displayName: "",
  bio: "",
  email: "",
  phoneNumber: "",
  disciplines: [],
  experienceYears: "",
  competitionHighlights: "",
};

export function RiderProfileContent({ riderId }: { riderId: string }) {
  return (
    <RiderPageShell riderId={riderId} requireOwnership>
      {({ rider }) => <ProfileForm riderId={riderId} initial={rider} />}
    </RiderPageShell>
  );
}

function ProfileForm({
  riderId,
  initial,
}: {
  riderId: string;
  initial: RiderViewDto;
}) {
  const t = useTranslations("rider.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateRiderProfile(riderId);

  const form = useForm<RiderProfileFormValues>({
    resolver: zodResolver(riderProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded rider id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      displayName: initial.displayName ?? "",
      bio: initial.bio ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      disciplines: (initial.disciplines ?? []) as RiderProfileFormValues["disciplines"],
      experienceYears: initial.experienceYears != null ? String(initial.experienceYears) : "",
      competitionHighlights: (initial.competitionHighlights ?? []).join(", "),
    });
  }

  const isSubmitting = form.formState.isSubmitting;

  async function onSave(values: RiderProfileFormValues) {
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
            <RiderIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <RiderContactSection control={form.control} />
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
          <RiderVisibilitySection rider={initial} />
        </SectionErrorBoundary>
      </Section>
    </div>
  );
}
