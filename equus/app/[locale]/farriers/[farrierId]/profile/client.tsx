/**
 * FarrierProfileContent — owner profile tab (`/farriers/[farrierId]/profile`).
 *
 * Gated by `FarrierPageShell` (authenticated owner only, via the view DTO's
 * `isOwner`). Deferred RHF form (parent-owned `useForm` + one Save) composed of
 * identity and contact sections; visibility toggles autosave below via the
 * discovery PATCH.
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { SectionErrorBoundary } from "@/components/errors/section-error-boundary.tsx";
import { FarrierContactSection } from "@/components/farrier/profile/farrier-contact-section.tsx";
import { FarrierIdentitySection } from "@/components/farrier/profile/farrier-identity-section.tsx";
import { FarrierVisibilitySection } from "@/components/farrier/profile/farrier-visibility-section.tsx";
import { FarrierPageShell } from "@/components/farrier/farrier-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateFarrierProfile } from "@/hooks/queries/useFarrierProfile.ts";
import {
  farrierProfileFormSchema,
  type FarrierProfileFormValues,
} from "@/lib/validations/farrierForms.ts";
import type { FarrierViewDto } from "@/lib/services/farrierService.ts";

const emptyValues: FarrierProfileFormValues = {
  displayName: "",
  bio: "",
  email: "",
  phoneNumber: "",
  experienceYears: "",
  serviceAreaKm: "",
};

export function FarrierProfileContent({ farrierId }: { farrierId: string }) {
  return (
    <FarrierPageShell farrierId={farrierId} requireOwnership>
      {({ farrier }) => <ProfileForm farrierId={farrierId} initial={farrier} />}
    </FarrierPageShell>
  );
}

function ProfileForm({
  farrierId,
  initial,
}: {
  farrierId: string;
  initial: FarrierViewDto;
}) {
  const t = useTranslations("farrier.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateFarrierProfile(farrierId);

  const form = useForm<FarrierProfileFormValues>({
    resolver: zodResolver(farrierProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded farrier id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      displayName: initial.displayName ?? "",
      bio: initial.bio ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      experienceYears: initial.experienceYears != null ? String(initial.experienceYears) : "",
      serviceAreaKm: initial.serviceAreaKm != null ? String(initial.serviceAreaKm) : "",
    });
  }

  const isSubmitting = form.formState.isSubmitting;

  async function onSave(values: FarrierProfileFormValues) {
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
            <FarrierIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <FarrierContactSection control={form.control} />
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
          <FarrierVisibilitySection farrier={initial} />
        </SectionErrorBoundary>
      </Section>
    </div>
  );
}
