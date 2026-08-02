/**
 * GroomProfileContent — owner profile tab (`/groomers/[groomId]/profile`).
 *
 * Gated by `GroomPageShell` (authenticated owner only, via the view DTO's
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
import { GroomContactSection } from "@/components/groom/profile/groom-contact-section.tsx";
import { GroomIdentitySection } from "@/components/groom/profile/groom-identity-section.tsx";
import { GroomVisibilitySection } from "@/components/groom/profile/groom-visibility-section.tsx";
import { GroomPageShell } from "@/components/groom/groom-page-shell.tsx";
import { Section } from "@/components/shared/section.tsx";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/use-app-toast.ts";
import { useUpdateGroomProfile } from "@/hooks/queries/useGroomProfile.ts";
import {
  groomProfileFormSchema,
  type GroomProfileFormValues,
} from "@/lib/validations/groomForms.ts";
import type { GroomViewDto } from "@/lib/services/groomService.ts";

const emptyValues: GroomProfileFormValues = {
  displayName: "",
  bio: "",
  email: "",
  phoneNumber: "",
  specialties: "",
  experienceYears: "",
};

export function GroomProfileContent({ groomId }: { groomId: string }) {
  return (
    <GroomPageShell groomId={groomId} requireOwnership>
      {({ groom }) => <ProfileForm groomId={groomId} initial={groom} />}
    </GroomPageShell>
  );
}

function ProfileForm({
  groomId,
  initial,
}: {
  groomId: string;
  initial: GroomViewDto;
}) {
  const t = useTranslations("groom.profile");
  const toast = useAppToast();
  const updateProfile = useUpdateGroomProfile(groomId);

  const form = useForm<GroomProfileFormValues>({
    resolver: zodResolver(groomProfileFormSchema),
    defaultValues: emptyValues,
  });

  // Render-time seed (not an effect) — the endorsed replacement for a
  // setState-in-effect sync; guarded so it runs once per loaded groom id.
  const [seededId, setSeededId] = useState<string | null>(null);
  if (initial.id && seededId !== initial.id) {
    setSeededId(initial.id);
    form.reset({
      displayName: initial.displayName ?? "",
      bio: initial.bio ?? "",
      email: initial.email ?? "",
      phoneNumber: initial.phoneNumber ?? "",
      specialties: (initial.specialties ?? []).join(", "),
      experienceYears: initial.experienceYears != null ? String(initial.experienceYears) : "",
    });
  }

  const isSubmitting = form.formState.isSubmitting;

  async function onSave(values: GroomProfileFormValues) {
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
            <GroomIdentitySection control={form.control} />
          </SectionErrorBoundary>
        </Section>

        <Section title={t("contactSection")}>
          <SectionErrorBoundary message={t("loadFailed")}>
            <GroomContactSection control={form.control} />
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
          <GroomVisibilitySection groom={initial} />
        </SectionErrorBoundary>
      </Section>
    </div>
  );
}
